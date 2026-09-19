"""
Deterministic Interaction Engine for MedSafe AI.

Enforces strict safety principles:
- Normalizes every medicine name.
- Sorts ingredient pairs alphabetically (ingredient_a < ingredient_b).
- Looks up exact curated DDI rules.
- Severity comes ONLY from curated rules: high, moderate, low, or unknown.
- Exact unknown sentence requirement:
  "No known interaction was found in this prototype dataset. This does not confirm that the combination is safe."
- Overall risk is the highest severity among pair results.
- Never infers risk from TF-IDF or LLM output.
"""

import logging
from typing import List, Tuple, Dict, Any, Set
from app.schemas.request_response import (
    NormalizedMedication,
    PairResult,
    EvidenceCitation,
)
from app.services.database_service import get_ddi_rule

logger = logging.getLogger("medsafe.engine")

EXACT_UNKNOWN_TEXT = "No known interaction was found in this prototype dataset. This does not confirm that the combination is safe."

SEVERITY_RANK = {
    "high": 3,
    "moderate": 2,
    "low": 1,
    "unknown": 0,
}


def generate_canonical_pairs(medications: List[NormalizedMedication]) -> List[Tuple[NormalizedMedication, NormalizedMedication]]:
    """
    Generates all unique pairwise combinations of medications.
    Ensures ingredient_a < ingredient_b in alphabetical canonical order.
    """
    pairs: List[Tuple[NormalizedMedication, NormalizedMedication]] = []
    seen_keys: Set[str] = set()

    for i in range(len(medications)):
        for j in range(i + 1, len(medications)):
            med_1 = medications[i]
            med_2 = medications[j]

            c1 = med_1.canonical_name.strip().lower()
            c2 = med_2.canonical_name.strip().lower()

            # Ignore self-pairs if identical ingredients were entered twice
            if c1 == c2:
                continue

            if c1 < c2:
                first, second = med_1, med_2
            else:
                first, second = med_2, med_1

            key = f"{first.canonical_name.lower()}|{second.canonical_name.lower()}"
            if key not in seen_keys:
                seen_keys.add(key)
                pairs.append((first, second))

    return pairs


from app.services.database_service import get_ddi_rule, get_ddi_rule_by_rxcui
from app.services.rxnorm_service import sanitize_medication_name


def evaluate_pair_interaction(med_a: NormalizedMedication, med_b: NormalizedMedication) -> PairResult:
    """
    Evaluates a single pair of normalized medications using a multi-tiered detection pipeline:
    Tier 1: Exact RxCUI pair lookup
    Tier 2: Primary canonical ingredient name pair lookup
    Tier 3: Secondary synonym / alias cross-match
    Tier 4: Unknown fallback with strict non-safety disclaimer
    """
    ing_a = med_a.canonical_name.strip().lower()
    ing_b = med_b.canonical_name.strip().lower()

    rule = None
    match_tier = None

    # Tier 1: Exact RxCUI pair lookup
    if med_a.rxcui and med_b.rxcui:
        rule = get_ddi_rule_by_rxcui(med_a.rxcui, med_b.rxcui)
        if rule:
            match_tier = f"Tier 1 (RxCUI Pair {med_a.rxcui}|{med_b.rxcui})"

    # Tier 2: Primary canonical ingredient pair lookup
    if not rule:
        rule = get_ddi_rule(ing_a, ing_b)
        if rule:
            match_tier = f"Tier 2 (Canonical Name Pair {ing_a}|{ing_b})"

    # Tier 3: Secondary synonym / alias cross-matching
    if not rule:
        cands_a = {ing_a, sanitize_medication_name(med_a.entered_name)}
        if hasattr(med_a, "synonyms") and med_a.synonyms:
            cands_a.update([sanitize_medication_name(s) for s in med_a.synonyms if s])

        cands_b = {ing_b, sanitize_medication_name(med_b.entered_name)}
        if hasattr(med_b, "synonyms") and med_b.synonyms:
            cands_b.update([sanitize_medication_name(s) for s in med_b.synonyms if s])

        cands_a.discard("")
        cands_b.discard("")

        for ca in cands_a:
            for cb in cands_b:
                if ca == cb:
                    continue
                found = get_ddi_rule(ca, cb)
                if found:
                    rule = found
                    match_tier = f"Tier 3 (Synonym Cross-Match '{ca}' | '{cb}')"
                    break
            if rule:
                break

    if rule:
        logger.info(f"Interaction matched for [{med_a.canonical_name}] + [{med_b.canonical_name}] via {match_tier}")
        risk_level = rule.get("risk_level", "unknown").lower()
        title = rule.get("mechanism", f"Interaction between {ing_a} and {ing_b}")
        plain_exp = rule.get("patient_friendly_summary", "A potential interaction exists between these medicines.")
        why_matters = f"Combining {med_a.canonical_name} and {med_b.canonical_name} can lead to adverse pharmacological effects."
        recommended_action = rule.get(
            "recommended_action_template",
            "Contact a pharmacist or prescriber before combining these medicines."
        )
        urgent_warning = rule.get("urgent_warning_template")

        # Evidence source citation
        evidence_list: List[EvidenceCitation] = []
        src = rule.get("sources") or {}
        if src:
            evidence_list.append(
                EvidenceCitation(
                    source_name=src.get("source_name", "FDA DailyMed"),
                    source_url=src.get("source_url", "https://dailymed.nlm.nih.gov"),
                    label_section=src.get("section_name", "Drug Interactions"),
                    excerpt=rule.get("patient_friendly_summary", "FDA Drug Label Insert"),
                )
            )

        return PairResult(
            medicine_a=med_a.canonical_name,
            medicine_b=med_b.canonical_name,
            risk_level=risk_level,
            title=title,
            plain_explanation=plain_exp,
            why_it_matters=why_matters,
            recommended_action=recommended_action,
            urgent_warning=urgent_warning,
            evidence=evidence_list,
        )

    logger.info(f"No structured rule matched for [{med_a.canonical_name}] + [{med_b.canonical_name}]. Returning unknown status.")
    # UNKNOWN RESULT (No rule found in prototype dataset)
    return PairResult(
        medicine_a=med_a.canonical_name,
        medicine_b=med_b.canonical_name,
        risk_level="unknown",
        title=f"No curated interaction record for {med_a.canonical_name} and {med_b.canonical_name}",
        plain_explanation=EXACT_UNKNOWN_TEXT,
        why_it_matters="Limited prototype data available.",
        recommended_action="Always consult a licensed pharmacist or physician for unlisted medicine combinations.",
        urgent_warning=None,
        evidence=[],
    )


def calculate_overall_risk(pair_results: List[PairResult]) -> str:
    """
    Determines overall risk level as the highest severity among all pair results.
    """
    if not pair_results:
        return "unknown"

    highest_rank = 0
    overall = "unknown"

    for p in pair_results:
        rank = SEVERITY_RANK.get(p.risk_level.lower(), 0)
        if rank > highest_rank:
            highest_rank = rank
            overall = p.risk_level.lower()

    return overall
