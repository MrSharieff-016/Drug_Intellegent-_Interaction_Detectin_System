"""
RxNorm Normalization & Autocomplete Service.
Integrates with NIH RxNav API to resolve Indian & Global brand/generic names to RxCUIs and canonical active ingredients.
Includes comprehensive local dictionary fallback mapping popular Indian brand names (Dolo 650, Brufen, Combiflam, Manforce, Ecosprin, etc.).
"""

import logging
import httpx
from typing import List, Dict, Optional, Tuple
from app.config import settings
from app.schemas.request_response import NormalizedMedication, SuggestionItem

logger = logging.getLogger("medsafe.rxnorm")

# Comprehensive canonical dictionary including popular Indian brand names & global drugs
KNOWN_CANONICAL_MAP: Dict[str, Tuple[str, str, List[str]]] = {
    # Warfarin
    "warfarin": ("11289", "warfarin", ["Coumadin", "Jantoven", "Warf", "Uniwarf"]),
    "coumadin": ("11289", "warfarin", ["Warfarin Sodium"]),
    "jantoven": ("11289", "warfarin", ["Warfarin"]),
    "warf": ("11289", "warfarin", ["Warfarin Sodium (India)"]),

    # Ibuprofen / NSAIDs
    "ibuprofen": ("5640", "ibuprofen", ["Advil", "Motrin", "Brufen", "Combiflam", "Ibugesic"]),
    "advil": ("5640", "ibuprofen", ["Advil Liqui-Gels", "Ibuprofen"]),
    "motrin": ("5640", "ibuprofen", ["Motrin IB", "Ibuprofen"]),
    "brufen": ("5640", "ibuprofen", ["Brufen 400mg (Abbott India)", "Ibuprofen"]),
    "combiflam": ("5640", "ibuprofen", ["Combiflam (Ibuprofen + Paracetamol Sanofi India)"]),
    "ibugesic": ("5640", "ibuprofen", ["Ibugesic (Cipla India)"]),

    # Aspirin
    "aspirin": ("1191", "aspirin", ["Bayer Aspirin", "Ecosprin", "Disprin", "Acetylsalicylic Acid"]),
    "ecosprin": ("1191", "aspirin", ["Ecosprin 75/150 (USV India)", "Aspirin"]),
    "disprin": ("1191", "aspirin", ["Disprin Soluble (Reckitt Benckiser India)"]),

    # Paracetamol / Acetaminophen
    "paracetamol": ("161", "acetaminophen", ["Dolo 650", "Crocin", "Calpol", "Metacin", "Tylenol", "Panadol"]),
    "acetaminophen": ("161", "acetaminophen", ["Dolo 650", "Crocin", "Calpol", "Tylenol"]),
    "dolo 650": ("161", "acetaminophen", ["Dolo 650 mg (Micro Labs India)"]),
    "dolo": ("161", "acetaminophen", ["Dolo 650 mg (Micro Labs India)"]),
    "crocin": ("161", "acetaminophen", ["Crocin 650 / Advance (GSK India)"]),
    "calpol": ("161", "acetaminophen", ["Calpol 500/650 (GSK India)"]),
    "tylenol": ("161", "acetaminophen", ["Extra Strength Tylenol"]),

    # Sildenafil / Nitrates
    "sildenafil": ("10008", "sildenafil", ["Viagra", "Manforce", "Penegra", "Caverta", "Revatio"]),
    "viagra": ("10008", "sildenafil", ["Sildenafil Pfizer"]),
    "manforce": ("10008", "sildenafil", ["Manforce 50/100 (Mankind Pharma India)"]),
    "penegra": ("10008", "sildenafil", ["Penegra (Zydus Cadila India)"]),
    "caverta": ("10008", "sildenafil", ["Caverta (Sun Pharma India)"]),

    "nitroglycerin": ("7407", "nitroglycerin", ["Nitrostat", "Nitrolong", "Angiplat", "Nitrocontin"]),
    "nitrostat": ("7407", "nitroglycerin", ["Nitroglycerin Sublingual"]),
    "nitrolong": ("7407", "nitroglycerin", ["Nitrolong (Mankind Pharma India)"]),
    "angiplat": ("7407", "nitroglycerin", ["Angiplat (Torrent Pharma India)"]),

    # Lisinopril / Spironolactone
    "lisinopril": ("29046", "lisinopril", ["Prinivil", "Zestril", "Listril", "Lipril"]),
    "listril": ("29046", "lisinopril", ["Listril (Torrent Pharma India)"]),
    "spironolactone": ("9997", "spironolactone", ["Aldactone", "Laxispiron", "CaroSpir"]),
    "aldactone": ("9997", "spironolactone", ["Aldactone (RPG Life Sciences India)"]),

    # Sertraline / Tramadol
    "sertraline": ("36437", "sertraline", ["Zoloft", "Daxid", "Sertal"]),
    "zoloft": ("36437", "sertraline", ["Sertraline Hydrochloride"]),
    "daxid": ("36437", "sertraline", ["Daxid (Sun Pharma India)"]),

    "tramadol": ("10689", "tramadol", ["Ultram", "Ultracet", "Tramazac", "ConZip"]),
    "ultram": ("10689", "tramadol", ["Tramadol Hydrochloride"]),
    "ultracet": ("10689", "tramadol", ["Ultracet (Janssen / J&J India)"]),
    "tramazac": ("10689", "tramadol", ["Tramazac (Zydus Cadila India)"]),

    # Metformin
    "metformin": ("6809", "metformin", ["Glucophage", "Glycomet", "Obimet", "Gluconorm"]),
    "glucophage": ("6809", "metformin", ["Metformin Hydrochloride"]),
    "glycomet": ("6809", "metformin", ["Glycomet 500/850/1000 (USV India)"]),
    "gluconorm": ("6809", "metformin", ["Gluconorm (Lupin India)"]),

    # Amlodipine / Simvastatin
    "amlodipine": ("17767", "amlodipine", ["Norvasc", "Stamlo", "Amlovas", "Amlopin"]),
    "norvasc": ("17767", "amlodipine", ["Amlodipine Besylate"]),
    "stamlo": ("17767", "amlodipine", ["Stamlo (Dr. Reddy's India)"]),
    "amlovas": ("17767", "amlodipine", ["Amlovas (Macleods India)"]),

    "simvastatin": ("36567", "simvastatin", ["Zocor", "Simvotin"]),
    "zocor": ("36567", "simvastatin", ["Simvastatin"]),
    "simvotin": ("36567", "simvastatin", ["Simvotin (Ranbaxy / Sun Pharma India)"]),

    # Radiocontrast Media
    "contrast media": ("228494", "iodinated contrast media", ["Radiopaque Contrast"]),
    "iohexol": ("228494", "iodinated contrast media", ["Omnipaque"]),
}


async def normalize_medication_name(entered_name: str) -> NormalizedMedication:
    """
    Resolves an entered brand or generic medication name (Indian or global) to RxCUI and canonical active ingredient.
    """
    clean_name = entered_name.strip()
    low_name = clean_name.lower()

    # 1. Check local canonical dictionary first (fast fallback for Indian & global brands)
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
            url = f"{settings.RXNORM_BASE_URL}/rxcui.json"
            resp = await client.get(url, params={"name": clean_name})
            if resp.status_code == 200:
                data = resp.json()
                id_group = data.get("idGroup", {})
                rx_list = id_group.get("rxnormId", [])
                if rx_list:
                    rxcui = rx_list[0]
                    ing_url = f"{settings.RXNORM_BASE_URL}/rxcui/{rxcui}/allrelated.json"
                    ing_resp = await client.get(ing_url)
                    canonical_name = clean_name.lower()
                    if ing_resp.status_code == 200:
                        ing_data = ing_resp.json()
                        concept_groups = ing_data.get("allRelatedGroup", {}).get("conceptGroup", [])
                        for group in concept_groups:
                            if group.get("tty") in ["IN", "PIN"]:
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

    return NormalizedMedication(
        entered_name=clean_name,
        canonical_name=clean_name.lower(),
        rxcui="00000",
        synonyms=[],
    )


async def get_medication_suggestions(query: str) -> List[SuggestionItem]:
    """
    Returns RxNorm & Indian brand autocomplete suggestions for a search string.
    """
    q = query.strip().lower()
    if not q:
        return []

    suggestions: List[SuggestionItem] = []
    seen = set()

    for k, v in KNOWN_CANONICAL_MAP.items():
        if q in k:
            if k not in seen:
                seen.add(k)
                suggestions.append(
                    SuggestionItem(
                        name=k.title(),
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
