"""
Gemini LLM Explanation Service using official google-genai SDK.

Strict Guardrails:
- Must preserve deterministic risk levels.
- Validates JSON output with Pydantic.
- Low temperature (0.1).
- Falls back to deterministic interaction results on error or injection detection.
"""

import json
import logging
from typing import List, Optional, Dict, Any
from app.config import settings
from app.schemas.request_response import PairResult, AnalyzeResponse, NormalizedMedication

logger = logging.getLogger("medsafe.gemini")

GEMINI_SYSTEM_PROMPT = (
    "You are MedSafe AI, an educational medication-combination explanation assistant. "
    "You are not a doctor and you do not make clinical decisions. "
    "Use only the provided normalized medicines, deterministic risk result, and evidence excerpts. "
    "Do not add facts, diagnoses, doses, interactions, contraindications, sources, or certainty not present in the evidence. "
    "Never instruct a user to start, stop, or change a medicine. "
    "Explain in empathetic, plain language at approximately an eighth-grade reading level. "
    "Preserve the supplied risk level exactly. "
    "If evidence is missing or uncertain, say so clearly. "
    "Include the supplied safety disclaimer. "
    "Return JSON matching the required schema only."
)


async def generate_plain_explanations(
    normalized_meds: List[NormalizedMedication],
    pair_results: List[PairResult],
    overall_risk: str
) -> List[PairResult]:
    """
    Enhances deterministic pair results with plain-language empathetic explanations via Gemini API.
    Enforces strict Pydantic validation and fallback logic.
    """
    if not settings.GEMINI_API_KEY:
        logger.info("GEMINI_API_KEY not set. Returning deterministic results directly.")
        return pair_results

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        # Build prompt payload
        pairs_payload = []
        for p in pair_results:
            pairs_payload.append({
                "medicine_a": p.medicine_a,
                "medicine_b": p.medicine_b,
                "risk_level": p.risk_level,
                "title": p.title,
                "raw_summary": p.plain_explanation,
                "why_it_matters": p.why_it_matters,
                "recommended_action": p.recommended_action,
                "urgent_warning": p.urgent_warning,
                "evidence_excerpts": [e.excerpt for e in p.evidence]
            })

        user_content = json.dumps({
            "medications": [m.canonical_name for m in normalized_meds],
            "overall_risk": overall_risk,
            "pair_results": pairs_payload
        }, indent=2)

        prompt_text = (
            f"INPUT DATA:\n{user_content}\n\n"
            "TASK: Rephrase each pair's explanation and why_it_matters into accessible, 8th-grade plain language. "
            "CRITICAL: Keep the risk_level for every pair EXACTLY as provided. "
            "Do NOT alter the risk_level or state 'safe' or 'no risk'. "
            "Output a JSON object with key 'pair_explanations' containing an array of objects matching:\n"
            "[\n"
            "  {\n"
            "    \"medicine_a\": \"...\",\n"
            "    \"medicine_b\": \"...\",\n"
            "    \"risk_level\": \"...\",\n"
            "    \"plain_explanation\": \"...\",\n"
            "    \"why_it_matters\": \"...\",\n"
            "    \"recommended_action\": \"...\"\n"
            "  }\n"
            "]"
        )

        config = types.GenerateContentConfig(
            system_instruction=GEMINI_SYSTEM_PROMPT,
            temperature=0.1,
            response_mime_type="application/json"
        )

        # Call Gemini model
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt_text,
            config=config
        )

        if not response.text:
            logger.warning("Empty response from Gemini. Falling back to deterministic results.")
            return pair_results

        # Parse JSON output
        parsed_json = json.loads(response.text)
        explanations = parsed_json.get("pair_explanations", parsed_json if isinstance(parsed_json, list) else [])

        # Validate and update pair results strictly
        updated_pairs = []
        for idx, orig in enumerate(pair_results):
            matching_exp = None
            if idx < len(explanations):
                matching_exp = explanations[idx]

            if matching_exp:
                # Security Check: Ensure Gemini did not override risk_level
                llm_risk = str(matching_exp.get("risk_level", "")).lower().strip()
                if llm_risk and llm_risk != orig.risk_level.lower():
                    logger.warning(f"Gemini attempted to override risk_level from '{orig.risk_level}' to '{llm_risk}'. Rejecting LLM edit.")
                    updated_pairs.append(orig)
                    continue

                # Safety Check: Prevent LLM from declaring "safe" or "no risk"
                new_plain = str(matching_exp.get("plain_explanation", orig.plain_explanation))
                if "safe" in new_plain.lower() or "no risk" in new_plain.lower():
                    logger.warning("Gemini output contained prohibited word 'safe' or 'no risk'. Rejecting edit.")
                    updated_pairs.append(orig)
                    continue

                # Create updated pair
                updated_pairs.append(
                    PairResult(
                        medicine_a=orig.medicine_a,
                        medicine_b=orig.medicine_b,
                        risk_level=orig.risk_level,
                        title=orig.title,
                        plain_explanation=new_plain,
                        why_it_matters=str(matching_exp.get("why_it_matters", orig.why_it_matters)),
                        recommended_action=str(matching_exp.get("recommended_action", orig.recommended_action)),
                        urgent_warning=orig.urgent_warning,
                        evidence=orig.evidence
                    )
                )
            else:
                updated_pairs.append(orig)

        return updated_pairs

    except Exception as e:
        logger.error(f"Gemini Service execution failed or validation error: {e}. Falling back to deterministic results.")
        return pair_results
