"""
RxNorm Normalization & Autocomplete Service.
Integrates with NIH RxNav API to resolve brand/generic names to RxCUIs and canonical active ingredients.
Includes local dictionary fallback for offline execution and fast test suite runs.
"""

import logging
import httpx
from typing import List, Dict, Optional, Tuple
from app.config import settings
from app.schemas.request_response import NormalizedMedication, SuggestionItem

logger = logging.getLogger("medsafe.rxnorm")

# Offline fallback dictionary for common demo & benchmark drugs
KNOWN_CANONICAL_MAP: Dict[str, Tuple[str, str, List[str]]] = {
    "warfarin": ("11289", "warfarin", ["Coumadin", "Jantoven"]),
    "coumadin": ("11289", "warfarin", ["Warfarin Sodium"]),
    "jantoven": ("11289", "warfarin", ["Warfarin"]),
    "ibuprofen": ("5640", "ibuprofen", ["Advil", "Motrin", "Nurofen"]),
    "advil": ("5640", "ibuprofen", ["Advil Liqui-Gels", "Ibuprofen"]),
    "motrin": ("5640", "ibuprofen", ["Motrin IB", "Ibuprofen"]),
    "aspirin": ("1191", "aspirin", ["Bayer Aspirin", "Ecotrin", "Acetylsalicylic Acid"]),
    "paracetamol": ("161", "acetaminophen", ["Tylenol", "Panadol", "Acetaminophen"]),
    "acetaminophen": ("161", "acetaminophen", ["Tylenol", "Panadol"]),
    "tylenol": ("161", "acetaminophen", ["Extra Strength Tylenol"]),
    "sildenafil": ("10008", "sildenafil", ["Viagra", "Revatio"]),
    "viagra": ("10008", "sildenafil", ["Sildenafil"]),
    "nitroglycerin": ("7407", "nitroglycerin", ["Nitrostat", "Nitrolingual", "Nitrodur"]),
    "nitrostat": ("7407", "nitroglycerin", ["Nitroglycerin Sublingual"]),
    "lisinopril": ("29046", "lisinopril", ["Prinivil", "Zestril"]),
    "spironolactone": ("9997", "spironolactone", ["Aldactone", "CaroSpir"]),
    "sertraline": ("36437", "sertraline", ["Zoloft"]),
    "zoloft": ("36437", "sertraline", ["Sertraline Hydrochloride"]),
    "tramadol": ("10689", "tramadol", ["Ultram", "ConZip"]),
    "ultram": ("10689", "tramadol", ["Tramadol Hydrochloride"]),
    "metformin": ("6809", "metformin", ["Glucophage", "Fortamet"]),
    "glucophage": ("6809", "metformin", ["Metformin Hydrochloride"]),
    "amlodipine": ("17767", "amlodipine", ["Norvasc"]),
    "norvasc": ("17767", "amlodipine", ["Amlodipine Besylate"]),
    "simvastatin": ("36567", "simvastatin", ["Zocor"]),
    "zocor": ("36567", "simvastatin", ["Simvastatin"]),
    "contrast media": ("228494", "iodinated contrast media", ["Radiopaque Contrast"]),
    "iohexol": ("228494", "iodinated contrast media", ["Omnipaque"]),
}


async def normalize_medication_name(entered_name: str) -> NormalizedMedication:
    """
    Resolves an entered brand or generic medication name to its RxCUI and canonical active ingredient.
    """
    clean_name = entered_name.strip()
    low_name = clean_name.lower()

    # 1. Check local canonical dictionary first
    if low_name in KNOWN_CANONICAL_MAP:
        rxcui, canonical, syns = KNOWN_CANONICAL_MAP[low_name]
        return NormalizedMedication(
            entered_name=clean_name,
            canonical_name=canonical,
            rxcui=rxcui,
            synonyms=syns,
        )

    # 2. Try RxNav NIH REST API
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            # Query exact rxcui
            url = f"{settings.RXNORM_BASE_URL}/rxcui.json"
            resp = await client.get(url, params={"name": clean_name})
            if resp.status_code == 200:
                data = resp.json()
                id_group = data.get("idGroup", {})
                rx_list = id_group.get("rxnormId", [])
                if rx_list:
                    rxcui = rx_list[0]
                    # Fetch ingredient concept
                    ing_url = f"{settings.RXNORM_BASE_URL}/rxcui/{rxcui}/allrelated.json"
                    ing_resp = await client.get(ing_url)
                    canonical_name = clean_name.lower()
                    if ing_resp.status_code == 200:
                        ing_data = ing_resp.json()
                        concept_groups = ing_data.get("allRelatedGroup", {}).get("conceptGroup", [])
                        for group in concept_groups:
                            if group.get("tty") in ["IN", "PIN"]:  # Ingredient / Precise Ingredient
                                concepts = group.get("conceptProperties", [])
                                if concepts:
                                    canonical_name = concepts[0].get("name", clean_name).lower()
                                    break
                    
                    return NormalizedMedication(
                        entered_name=clean_name,
                        canonical_name=canonical_name,
                        rxcui=rxcui,
                        synonyms=[],
                    )

            # Try approximate term search
            approx_url = f"{settings.RXNORM_BASE_URL}/approximateTerm.json"
            approx_resp = await client.get(approx_url, params={"term": clean_name, "maxEntries": 1})
            if approx_resp.status_code == 200:
                approx_data = approx_resp.json()
                candidates = approx_data.get("approximateGroup", {}).get("candidate", [])
                if candidates:
                    first = candidates[0]
                    rxcui = first.get("rxcui", "0000")
                    canonical_name = first.get("name", clean_name).lower()
                    return NormalizedMedication(
                        entered_name=clean_name,
                        canonical_name=canonical_name,
                        rxcui=rxcui,
                        synonyms=[],
                    )

    except Exception as e:
        logger.warning(f"RxNorm API call failed for '{clean_name}': {e}. Using sanitized string.")

    # Fallback default if not found in RxNorm API
    return NormalizedMedication(
        entered_name=clean_name,
        canonical_name=clean_name.lower(),
        rxcui="00000",
        synonyms=[],
    )


async def get_medication_suggestions(query: str) -> List[SuggestionItem]:
    """
    Returns RxNorm autocomplete suggestions for a search string.
    """
    q = query.strip().lower()
    if not q:
        return []

    suggestions: List[SuggestionItem] = []
    seen = set()

    # 1. Match local dictionary
    for k, v in KNOWN_CANONICAL_MAP.items():
        if q in k:
            if k not in seen:
                seen.add(k)
                suggestions.append(
                    SuggestionItem(
                        name=k.capitalize(),
                        rxcui=v[0],
                        type="brand" if k != v[1] else "generic",
                    )
                )
            if v[1] not in seen:
                seen.add(v[1])
                suggestions.append(
                    SuggestionItem(
                        name=v[1].capitalize(),
                        rxcui=v[0],
                        type="generic",
                    )
                )

    # 2. Try RxNav spelling suggestions API
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            url = f"{settings.RXNORM_BASE_URL}/spellingsuggestions.json"
            resp = await client.get(url, params={"name": q})
            if resp.status_code == 200:
                data = resp.json()
                sug_list = data.get("suggestionGroup", {}).get("suggestionList", {}).get("suggestion", [])
                for sug in sug_list:
                    sug_low = sug.lower()
                    if sug_low not in seen:
                        seen.add(sug_low)
                        suggestions.append(
                            SuggestionItem(
                                name=sug.capitalize(),
                                rxcui=None,
                                type="generic",
                            )
                        )
                        if len(suggestions) >= 10:
                            break
    except Exception as e:
        logger.warning(f"RxNorm spelling suggestions failed for '{q}': {e}")

    return suggestions[:10]
