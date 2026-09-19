"""
FastAPI Routes for MedSafe AI API.
"""

import uuid
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Header

from app.schemas.request_response import (
    AnalyzeRequest,
    AnalyzeResponse,
    NormalizedMedication,
    PairResult,
    SuggestionItem,
    FeedbackRequest,
    FeedbackResponse,
    AnalysisHistoryItem,
)
from app.services.rxnorm_service import normalize_medication_name, get_medication_suggestions
from app.services.interaction_engine import (
    generate_canonical_pairs,
    evaluate_pair_interaction,
    calculate_overall_risk,
)
from app.services.retrieval_service import retrieve_evidence_for_pair
from app.services.gemini_service import generate_plain_explanations, analyze_unlisted_pair_with_ai
from app.services.database_service import (
    save_analysis,
    get_user_analyses,
    get_analysis_by_id,
    save_feedback,
    register_local_ddi_rule,
    get_ddi_rule,
    get_ddi_rule_by_rxcui,
)

logger = logging.getLogger("medsafe.api")
router = APIRouter()


@router.get("/health")
async def health_check():
    """Health check endpoint for Render and monitoring."""
    return {"status": "ok", "app": "MedSafe AI", "version": "1.0.0"}


@router.get("/api/medications/suggest", response_model=List[SuggestionItem])
async def suggest_medications(q: str = Query(..., min_length=1, description="Search term")):
    """Returns RxNorm medication name autocomplete suggestions."""
    return await get_medication_suggestions(q)


@router.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_medications(
    payload: AnalyzeRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    """
    Main Risk Analysis Endpoint.
    1. Normalizes medication names through RxNorm.
    2. Sorts ingredient pairs alphabetically.
    3. Evaluates deterministic interaction rules.
    4. Retrieves cited evidence from TF-IDF RAG index.
    5. Formats structured plain-language explanations via Gemini API with fallback guardrails.
    """
    if not payload.medications:
        raise HTTPException(status_code=400, detail="At least one medication must be provided.")

    # 1. Normalize medications via RxNorm
    normalized_list: List[NormalizedMedication] = []
    unresolved_list = []

    logger.info(f"=== ANALYZE REQUEST: Raw input medications: {[m.name for m in payload.medications]} ===")

    for item in payload.medications:
        norm = await normalize_medication_name(item.name)
        if norm:
            normalized_list.append(norm)
            logger.info(f"Normalized: '{item.name}' -> canonical='{norm.canonical_name}', rxcui='{norm.rxcui}', synonyms={norm.synonyms}")
        else:
            unresolved_list.append({
                "entered_name": item.name,
                "reason": "Could not normalize medicine name with RxNorm database.",
                "suggestions": [f"{item.name} 5mg", f"{item.name} generic"]
            })

    analysis_id = str(uuid.uuid4())

    # Single medicine case: no interaction pair possible
    if len(normalized_list) < 2:
        res = AnalyzeResponse(
            analysis_id=analysis_id,
            overall_risk="unknown",
            disclaimer="Educational prototype only; verify with a pharmacist or prescriber.",
            normalized_medications=normalized_list,
            pair_results=[],
            not_found_or_ambiguous=unresolved_list,
            retrieval_confidence=0.0
        )
        save_analysis(
            analysis_id=analysis_id,
            user_id=x_user_id,
            overall_risk="unknown",
            request_json=payload.model_dump(),
            response_json=res.model_dump()
        )
        return res

    # 2. Generate canonical alphabetical pairs
    pairs = generate_canonical_pairs(normalized_list)
    logger.info(f"Generated {len(pairs)} canonical pair(s): {[(a.canonical_name, b.canonical_name) for a, b in pairs]}")
    pair_results: List[PairResult] = []
    confidence_scores: List[float] = []

    # 3. Evaluate rules & AI dynamic interaction reasoning for each pair
    for med_a, med_b in pairs:
        # Check if pair is in static curated DDI rules (Tiers 1-3)
        ing_a = med_a.canonical_name.strip().lower()
        ing_b = med_b.canonical_name.strip().lower()

        has_static_rule = False
        if med_a.rxcui and med_b.rxcui and med_a.rxcui != "00000" and med_b.rxcui != "00000":
            has_static_rule = bool(get_ddi_rule_by_rxcui(med_a.rxcui, med_b.rxcui))
        if not has_static_rule:
            has_static_rule = bool(get_ddi_rule(ing_a, ing_b))

        base_result = evaluate_pair_interaction(med_a, med_b)

        # If unlisted in static curated DB rules, perform dynamic AI clinical reasoning
        if not has_static_rule and "unknown" not in ing_a and "unknown" not in ing_b:
            ai_result = await analyze_unlisted_pair_with_ai(med_a, med_b)
            if ai_result:
                base_result = ai_result
                if ai_result.risk_level != "unknown":
                    # Cache dynamically analyzed rule into local DDI store
                    register_local_ddi_rule(
                        ing_a=med_a.canonical_name,
                        ing_b=med_b.canonical_name,
                        risk_level=ai_result.risk_level,
                        mechanism=ai_result.title,
                        patient_friendly_summary=ai_result.plain_explanation,
                        recommended_action_template=ai_result.recommended_action,
                        urgent_warning_template=ai_result.urgent_warning,
                        source_info={
                            "source_name": ai_result.evidence[0].source_name if ai_result.evidence else "CDSCO / IPC Guidelines",
                            "source_url": "https://cdsco.gov.in/",
                            "title": ai_result.title,
                            "section_name": "AI Dynamic Drug Interaction Evaluation"
                        },
                        rxcui_a=med_a.rxcui,
                        rxcui_b=med_b.rxcui,
                    )

        # Retrieve evidence snippets via TF-IDF
        retrieved_citations, conf = retrieve_evidence_for_pair(
            med_a.canonical_name, med_b.canonical_name
        )
        confidence_scores.append(conf)

        # Combine rule citations with TF-IDF evidence
        existing_urls = {e.source_url for e in base_result.evidence}
        for cit in retrieved_citations:
            if cit.source_url not in existing_urls:
                base_result.evidence.append(cit)
                existing_urls.add(cit.source_url)

        logger.info(f"Pair [{med_a.canonical_name} + {med_b.canonical_name}] result: risk='{base_result.risk_level}', title='{base_result.title}', tfidf_conf={conf}")
        pair_results.append(base_result)

    # 4. Overall risk = highest severity among pairs
    overall_risk = calculate_overall_risk(pair_results)
    avg_confidence = float(sum(confidence_scores) / len(confidence_scores)) if confidence_scores else 0.0

    # 5. Gemini plain-language explanation enhancement with guardrails
    final_pair_results = await generate_plain_explanations(
        normalized_meds=normalized_list,
        pair_results=pair_results,
        overall_risk=overall_risk
    )

    logger.info(f"=== FINAL ANALYSIS RESULT: overall_risk='{overall_risk}', avg_tfidf_confidence={avg_confidence} ===")

    response = AnalyzeResponse(
        analysis_id=analysis_id,
        overall_risk=overall_risk,  # type: ignore
        disclaimer="Educational prototype only; verify with a pharmacist or prescriber.",
        normalized_medications=normalized_list,
        pair_results=final_pair_results,
        not_found_or_ambiguous=unresolved_list,
        retrieval_confidence=round(avg_confidence, 2)
    )

    # Audit record saving
    save_analysis(
        analysis_id=analysis_id,
        user_id=x_user_id,
        overall_risk=overall_risk,
        request_json=payload.model_dump(),
        response_json=response.model_dump()
    )

    return response


@router.get("/api/analyses", response_model=List[AnalysisHistoryItem])
async def list_analyses(x_user_id: Optional[str] = Header(None, alias="X-User-ID")):
    """Returns past analysis history for authenticated or session user."""
    records = get_user_analyses(user_id=x_user_id, limit=30)
    history_items = []
    for r in records:
        resp = r.get("response_json", {})
        norm_meds = [m.get("canonical_name", "") for m in resp.get("normalized_medications", [])]
        pairs = resp.get("pair_results", [])
        history_items.append(
            AnalysisHistoryItem(
                id=r.get("id", str(uuid.uuid4())),
                created_at=r.get("created_at", "2026-09-19T12:00:00Z"),
                overall_risk=r.get("overall_risk", "unknown"),
                medications=norm_meds,
                pair_count=len(pairs)
            )
        )
    return history_items


@router.get("/api/analyses/{id}", response_model=AnalyzeResponse)
async def get_analysis_detail(id: str):
    """Retrieves full analysis output by ID."""
    rec = get_analysis_by_id(id)
    if not rec:
        raise HTTPException(status_code=404, detail=f"Analysis with ID '{id}' not found.")
    return rec.get("response_json")


@router.post("/api/feedback", response_model=FeedbackResponse)
async def submit_feedback(
    payload: FeedbackRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    """Saves user rating and comment for an analysis."""
    saved = save_feedback(
        analysis_id=payload.analysis_id,
        user_id=x_user_id,
        rating=payload.rating,
        comment=payload.comment
    )
    if saved:
        return FeedbackResponse(status="success", message="Thank you for your feedback!")
    raise HTTPException(status_code=500, detail="Failed to record feedback.")
