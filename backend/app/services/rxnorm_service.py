"""
RxNorm Normalization & Autocomplete Service.
Integrates with NIH RxNav API to resolve Indian & Global brand/generic names to RxCUIs and canonical active ingredients.
Includes comprehensive local dictionary fallback mapping popular Indian brand names (Dolo 650, Brufen, Combiflam, Manforce, Ecosprin, etc.).
"""

import re
import logging
import httpx
import difflib
from typing import List, Dict, Optional, Tuple
from app.config import settings
from app.schemas.request_response import NormalizedMedication, SuggestionItem

logger = logging.getLogger("medsafe.rxnorm")


def sanitize_medication_name(raw_name: str) -> str:
    """
    Cleans raw medication name input by stripping strengths (e.g. 75mg, 5 mg, 500mcg),
    dosage forms (oral, tablet, capsule, tab, cap, iv, injection, solution),
    punctuation, and extra whitespace.
    """
    if not raw_name:
        return ""

    clean = raw_name.lower().strip()

    # Remove dosage strengths & units like "75 mg", "5mg", "500 mcg", "10 ml", "5%"
    clean = re.sub(r'\b\d+(\.\d+)?\s*(mg|mcg|g|ml|l|unit|units|iu|%)\b', '', clean)
    # Remove standalone numbers like "650", "400", "75"
    clean = re.sub(r'\b\d+\b', '', clean)
    # Remove common dosage forms & route keywords
    forms = [
        "oral", "tablet", "tablets", "tab", "capsule", "capsules", "cap", "injection",
        "iv", "im", "topical", "syrup", "solution", "suspension", "drops", "sublingual",
        "patch", "cream", "ointment", "gel", "inhaler", "spray"
    ]
    pattern = r'\b(' + '|'.join(forms) + r')\b'
    clean = re.sub(pattern, '', clean)

    # Remove non-alphanumeric characters except spaces
    clean = re.sub(r'[^a-z0-9\s]', ' ', clean)
    # Collapse whitespace
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean


# Comprehensive canonical dictionary including popular Indian brand names & global drugs
KNOWN_CANONICAL_MAP: Dict[str, Tuple[str, str, List[str]]] = {
    # Warfarin
    "warfarin": ("11289", "warfarin", ["coumadin", "jantoven", "warf", "uniwarf", "warfarin sodium"]),
    "warfarin sodium": ("11289", "warfarin", ["coumadin", "jantoven", "warf", "uniwarf"]),
    "coumadin": ("11289", "warfarin", ["warfarin", "jantoven", "warf"]),
    "jantoven": ("11289", "warfarin", ["warfarin", "coumadin"]),
    "warf": ("11289", "warfarin", ["warfarin", "coumadin"]),

    # Ibuprofen / NSAIDs
    "ibuprofen": ("5640", "ibuprofen", ["advil", "motrin", "brufen", "combiflam", "ibugesic"]),
    "advil": ("5640", "ibuprofen", ["ibuprofen", "motrin", "brufen"]),
    "motrin": ("5640", "ibuprofen", ["ibuprofen", "advil", "brufen"]),
    "brufen": ("5640", "ibuprofen", ["ibuprofen", "advil", "combiflam"]),
    "combiflam": ("5640", "ibuprofen", ["ibuprofen", "brufen", "paracetamol"]),
    "ibugesic": ("5640", "ibuprofen", ["ibuprofen", "brufen"]),

    # Aspirin
    "aspirin": ("1191", "aspirin", ["acetylsalicylic acid", "ecosprin", "disprin", "bayer aspirin"]),
    "acetylsalicylic acid": ("1191", "aspirin", ["aspirin", "ecosprin", "disprin"]),
    "ecosprin": ("1191", "aspirin", ["aspirin", "acetylsalicylic acid", "disprin"]),
    "disprin": ("1191", "aspirin", ["aspirin", "ecosprin"]),
    "bayer aspirin": ("1191", "aspirin", ["aspirin"]),

    # Paracetamol / Acetaminophen
    "paracetamol": ("161", "acetaminophen", ["acetaminophen", "dolo", "dolo 650", "crocin", "calpol", "tylenol", "panadol", "metacin"]),
    "acetaminophen": ("161", "acetaminophen", ["paracetamol", "dolo", "dolo 650", "crocin", "calpol", "tylenol", "panadol"]),
    "dolo": ("161", "acetaminophen", ["paracetamol", "acetaminophen", "crocin"]),
    "dolo 650": ("161", "acetaminophen", ["paracetamol", "acetaminophen", "crocin"]),
    "crocin": ("161", "acetaminophen", ["paracetamol", "acetaminophen", "dolo"]),
    "calpol": ("161", "acetaminophen", ["paracetamol", "acetaminophen"]),
    "tylenol": ("161", "acetaminophen", ["paracetamol", "acetaminophen"]),
    "panadol": ("161", "acetaminophen", ["paracetamol", "acetaminophen"]),

    # Sildenafil / Nitrates
    "sildenafil": ("10008", "sildenafil", ["viagra", "manforce", "penegra", "caverta", "revatio", "sildenafil citrate"]),
    "sildenafil citrate": ("10008", "sildenafil", ["viagra", "manforce", "penegra"]),
    "viagra": ("10008", "sildenafil", ["sildenafil", "manforce"]),
    "manforce": ("10008", "sildenafil", ["sildenafil", "viagra"]),
    "penegra": ("10008", "sildenafil", ["sildenafil", "manforce"]),
    "caverta": ("10008", "sildenafil", ["sildenafil", "manforce"]),

    "nitroglycerin": ("7407", "nitroglycerin", ["nitrostat", "nitrolong", "angiplat", "nitrocontin", "glyceryl trinitrate"]),
    "glyceryl trinitrate": ("7407", "nitroglycerin", ["nitroglycerin", "nitrostat", "nitrolong"]),
    "nitrostat": ("7407", "nitroglycerin", ["nitroglycerin", "nitrolong"]),
    "nitrolong": ("7407", "nitroglycerin", ["nitroglycerin", "angiplat"]),
    "angiplat": ("7407", "nitroglycerin", ["nitroglycerin", "nitrolong"]),

    # Lisinopril / Spironolactone / Potassium
    "lisinopril": ("29046", "lisinopril", ["prinivil", "zestril", "listril", "lipril"]),
    "listril": ("29046", "lisinopril", ["lisinopril", "prinivil"]),
    "spironolactone": ("9997", "spironolactone", ["aldactone", "laxispiron", "carospir"]),
    "aldactone": ("9997", "spironolactone", ["spironolactone", "carospir"]),
    "potassium": ("8591", "potassium chloride", ["kcl", "potklor", "potassium"]),
    "potassium chloride": ("8591", "potassium chloride", ["kcl", "potklor"]),
    "kcl": ("8591", "potassium chloride", ["potassium"]),

    # Sertraline / Tramadol / Benzodiazepines
    "sertraline": ("36437", "sertraline", ["zoloft", "daxid", "sertal"]),
    "zoloft": ("36437", "sertraline", ["sertraline", "daxid"]),
    "daxid": ("36437", "sertraline", ["sertraline", "zoloft"]),
    "tramadol": ("10689", "tramadol", ["ultram", "ultracet", "tramazac", "conzip"]),
    "ultram": ("10689", "tramadol", ["tramadol", "ultracet"]),
    "ultracet": ("10689", "tramadol", ["tramadol", "tramazac"]),
    "tramazac": ("10689", "tramadol", ["tramadol", "ultram"]),
    "alprazolam": ("596", "alprazolam", ["xanax", "alprax", "restyl"]),
    "xanax": ("596", "alprazolam", ["alprazolam", "alprax"]),
    "alprax": ("596", "alprazolam", ["alprazolam", "xanax"]),

    # Alcohol / Ethanol
    "alcohol": ("448", "ethanol", ["alcohol", "ethanol", "liquor", "beer", "wine"]),
    "ethanol": ("448", "ethanol", ["alcohol"]),

    # Metformin
    "metformin": ("6809", "metformin", ["glucophage", "glycomet", "obimet", "gluconorm"]),
    "glucophage": ("6809", "metformin", ["metformin", "glycomet"]),
    "glycomet": ("6809", "metformin", ["metformin", "obimet"]),
    "gluconorm": ("6809", "metformin", ["metformin", "glycomet"]),

    # Amlodipine / Simvastatin
    "amlodipine": ("17767", "amlodipine", ["norvasc", "stamlo", "amlovas", "amlopin"]),
    "norvasc": ("17767", "amlodipine", ["amlodipine", "stamlo"]),
    "stamlo": ("17767", "amlodipine", ["amlodipine", "amlovas"]),
    "amlovas": ("17767", "amlodipine", ["amlodipine", "stamlo"]),
    "simvastatin": ("36567", "simvastatin", ["zocor", "simvotin"]),
    "zocor": ("36567", "simvastatin", ["simvastatin", "simvotin"]),
    "simvotin": ("36567", "simvastatin", ["simvastatin", "zocor"]),

    # Digoxin / Furosemide
    "digoxin": ("197517", "digoxin", ["lanoxin"]),
    "lanoxin": ("197517", "digoxin", ["digoxin"]),
    "furosemide": ("4603", "furosemide", ["lasix"]),
    "lasix": ("4603", "furosemide", ["furosemide"]),

    # Clopidogrel / Omeprazole
    "clopidogrel": ("32968", "clopidogrel", ["plavix", "deplatt", "clopivas"]),
    "plavix": ("32968", "clopidogrel", ["clopidogrel", "deplatt"]),
    "deplatt": ("32968", "clopidogrel", ["clopidogrel", "plavix"]),
    "omeprazole": ("7646", "omeprazole", ["prilosec", "omez"]),
    "omez": ("7646", "omeprazole", ["omeprazole", "prilosec"]),

    # Ciprofloxacin / Levofloxacin / Azithromycin / Antacids
    "ciprofloxacin": ("2551", "ciprofloxacin", ["cipro", "ciplox"]),
    "ciplox": ("2551", "ciprofloxacin", ["ciprofloxacin"]),
    "levofloxacin": ("82122", "levofloxacin", ["levaquin", "lcin"]),
    "azithromycin": ("18631", "azithromycin", ["zithromax", "azithral"]),
    "azithral": ("18631", "azithromycin", ["azithromycin"]),
    "theophylline": ("10438", "theophylline", ["deriphyllin", "theochron"]),
    "deriphyllin": ("10438", "theophylline", ["theophylline"]),
    "antacid": ("115250", "antacid", ["gelusil", "digene", "mucaine", "magnesium hydroxide", "aluminum hydroxide"]),
    "gelusil": ("115250", "antacid", ["antacid", "digene"]),

    # Diltiazem / Metoprolol / Haloperidol
    "diltiazem": ("3443", "diltiazem", ["dilzem", "cardizem"]),
    "dilzem": ("3443", "diltiazem", ["diltiazem"]),
    "metoprolol": ("6918", "metoprolol", ["betaloc", "lopressor", "toprol"]),
    "betaloc": ("6918", "metoprolol", ["metoprolol"]),
    "haloperidol": ("5093", "haloperidol", ["haldol", "serenace"]),
    "haldol": ("5093", "haloperidol", ["haloperidol"]),

    # Atorvastatin / Pantoprazole / Amoxicillin
    "atorvastatin": ("83367", "atorvastatin", ["atorva", "lipitor", "lipivas"]),
    "pantoprazole": ("40254", "pantoprazole", ["pan", "pan 40", "protonix"]),
    "pan 40": ("40254", "pantoprazole", ["pantoprazole", "pan"]),
    "amoxicillin": ("723", "amoxicillin", ["mox", "novamox", "amoxil"]),

    # Lithium
    "lithium": ("6448", "lithium", ["eskalith", "lithobid", "lithium carbonate", "licarb"]),
    "lithium carbonate": ("6448", "lithium", ["eskalith", "lithobid", "licarb"]),
    "eskalith": ("6448", "lithium", ["lithium"]),
    "lithobid": ("6448", "lithium", ["lithium"]),

    # NSAIDs (Naproxen, Diclofenac, Celecoxib)
    "naproxen": ("7258", "naproxen", ["aleve", "naprosyn", "xenar"]),
    "diclofenac": ("3355", "diclofenac", ["voltaren", "voveran", "cataflam"]),
    "voveran": ("3355", "diclofenac", ["diclofenac"]),
    "celecoxib": ("140587", "celecoxib", ["celebrex", "celact"]),

    # Antiarrhythmics & Cardio (Amiodarone, Verapamil, Losartan, Enalapril)
    "amiodarone": ("703", "amiodarone", ["cordarone", "pacerone"]),
    "verapamil": ("11170", "verapamil", ["calan", "isoptin", "verelan"]),
    "losartan": ("5224", "losartan", ["cozaar", "losar", "repace"]),
    "enalapril": ("3827", "enalapril", ["vasotec", "envas"]),

    # Antidepressants (Fluoxetine, Escitalopram)
    "fluoxetine": ("4493", "fluoxetine", ["prozac", "fludac", "sarafem"]),
    "escitalopram": ("321988", "escitalopram", ["lexapro", "nexito"]),
    "nexito": ("321988", "escitalopram", ["escitalopram"]),

    # Immunosuppressants & Antibiotics (Methotrexate, Ketoconazole, Clarithromycin)
    "methotrexate": ("6851", "methotrexate", ["rheumatrex", "trevall", "foltrax"]),
    "ketoconazole": ("6135", "ketoconazole", ["nizoral", "fungicide"]),
    "clarithromycin": ("21212", "clarithromycin", ["biaxin", "claribid"]),

    # Radiocontrast Media
    "contrast media": ("228494", "iodinated contrast media", ["radiopaque contrast", "iohexol", "omnipaque"]),
    "iodinated contrast media": ("228494", "iodinated contrast media", ["radiopaque contrast", "iohexol", "omnipaque"]),
    "iohexol": ("228494", "iodinated contrast media", ["omnipaque", "iodinated contrast media"]),

    # Allergy & Antihistamines
    "cetirizine": ("20610", "cetirizine", ["zyrtec", "cetzine", "okacet", "alercet"]),
    "zyrtec": ("20610", "cetirizine", ["cetirizine", "cetzine"]),
    "cetzine": ("20610", "cetirizine", ["cetirizine"]),
    "okacet": ("20610", "cetirizine", ["cetirizine"]),
    "levocetirizine": ("337535", "levocetirizine", ["xyzal", "levocet", "vozet", "1-cet"]),
    "xyzal": ("337535", "levocetirizine", ["levocetirizine"]),
    "loratadine": ("21307", "loratadine", ["claritin", "lorfast"]),
    "claritin": ("21307", "loratadine", ["loratadine"]),
    "fexofenadine": ("25480", "fexofenadine", ["allegra", "fexova", "histafree"]),
    "allegra": ("25480", "fexofenadine", ["fexofenadine"]),
    "montelukast": ("88249", "montelukast", ["singulair", "montair", "montek"]),
    "montair": ("88249", "montelukast", ["montelukast", "singulair"]),
    "diphenhydramine": ("3498", "diphenhydramine", ["benadryl"]),
    "benadryl": ("3498", "diphenhydramine", ["diphenhydramine"]),

    # Antibiotics (Cephalosporins, Macrolides, Tetracyclines, Penicillins)
    "clavulanate": ("2670", "clavulanate", ["clavulanic acid", "clav"]),
    "clavulanic acid": ("2670", "clavulanate", ["clavulanate"]),
    "augmentin": ("617314", "amoxicillin and clavulanate", ["augmentin", "moxikind-cv", "clamoxyl", "amoxyclav"]),
    "moxikind-cv": ("617314", "amoxicillin and clavulanate", ["augmentin", "amoxicillin"]),
    "amoxyclav": ("617314", "amoxicillin and clavulanate", ["augmentin"]),
    "doxycycline": ("3640", "doxycycline", ["vibramycin", "doxypal", "doxt", "microdox"]),
    "metronidazole": ("6902", "metronidazole", ["flagyl", "metrogyl"]),
    "flagyl": ("6902", "metronidazole", ["metronidazole"]),
    "metrogyl": ("6902", "metronidazole", ["metronidazole"]),
    "cephalexin": ("2231", "cephalexin", ["keflex", "cepdem", "sporidex"]),
    "cefixime": ("2193", "cefixime", ["suprax", "zifi", "taxim-o", "ceftas"]),
    "zifi": ("2193", "cefixime", ["cefixime"]),
    "ceftriaxone": ("2198", "ceftriaxone", ["rocephin", "monocef"]),
    "monocef": ("2198", "ceftriaxone", ["ceftriaxone"]),

    # Cardiovascular, Beta-Blockers & Antihypertensives
    "telmisartan": ("73494", "telmisartan", ["micardis", "telma", "telpres", "telsartan"]),
    "telma": ("73494", "telmisartan", ["telmisartan"]),
    "ramipril": ("35296", "ramipril", ["altace", "cardace"]),
    "cardace": ("35296", "ramipril", ["ramipril"]),
    "atenolol": ("1202", "atenolol", ["tenormin", "aten"]),
    "carvedilol": ("20352", "carvedilol", ["coreg", "carca"]),
    "propranolol": ("8787", "propranolol", ["inderal", "ciplar"]),
    "ciplar": ("8787", "propranolol", ["propranolol"]),
    "hydrochlorothiazide": ("5487", "hydrochlorothiazide", ["microzide", "hctz", "aquazide"]),
    "chlorthalidone": ("2404", "chlorthalidone", ["hygroton", "thalidone"]),
    "rosuvastatin": ("301542", "rosuvastatin", ["crestor", "rosuvas", "razel"]),
    "crestor": ("301542", "rosuvastatin", ["rosuvastatin"]),
    "rosuvas": ("301542", "rosuvastatin", ["rosuvastatin"]),

    # Gastrointestinal & Antiemetics
    "esomeprazole": ("283742", "esomeprazole", ["nexium", "esomac", "sompraz"]),
    "nexium": ("283742", "esomeprazole", ["esomeprazole"]),
    "rabeprazole": ("71104", "rabeprazole", ["aciphex", "rabeloc", "happi"]),
    "rabeloc": ("71104", "rabeprazole", ["rabeprazole"]),
    "ranitidine": ("9143", "ranitidine", ["zantac", "rantac", "aciloc"]),
    "aciloc": ("9143", "ranitidine", ["ranitidine"]),
    "famotidine": ("4278", "famotidine", ["pepcid", "facid"]),
    "ondansetron": ("26225", "ondansetron", ["zofran", "emeset", "vomikind"]),
    "emeset": ("26225", "ondansetron", ["ondansetron"]),
    "domperidone": ("3579", "domperidone", ["motilium", "vomistop"]),

    # Diabetes
    "glimepiride": ("25789", "glimepiride", ["amaryl", "g-limda", "glimy"]),
    "amaryl": ("25789", "glimepiride", ["glimepiride"]),
    "gliclazide": ("4815", "gliclazide", ["diamicron", "glyloc"]),
    "sitagliptin": ("593411", "sitagliptin", ["januvia", "istavel"]),
    "januvia": ("593411", "sitagliptin", ["sitagliptin"]),
    "vildagliptin": ("643064", "vildagliptin", ["galvus", "jalra"]),
    "galvus": ("643064", "vildagliptin", ["vildagliptin"]),
    "dapagliflozin": ("1488564", "dapagliflozin", ["farxiga", "forxiga", "dapa"]),
    "empagliflozin": ("1545653", "empagliflozin", ["jardiance"]),
    "jardiance": ("1545653", "empagliflozin", ["empagliflozin"]),
    "insulin": ("5856", "insulin", ["humalog", "novorapid", "lantus", "mixtard"]),

    # Pain, Neuro, Psych & Respiratory
    "gabapentin": ("25480", "gabapentin", ["neurontin", "gabapin", "gabaneuron"]),
    "gabapin": ("25480", "gabapentin", ["gabapentin"]),
    "pregabalin": ("187832", "pregabalin", ["lyrica", "pregeb", "maxgalin"]),
    "lyrica": ("187832", "pregabalin", ["pregabalin"]),
    "diazepam": ("3322", "diazepam", ["valium", "calmpose"]),
    "valium": ("3322", "diazepam", ["diazepam"]),
    "clonazepam": ("2598", "clonazepam", ["klonopin", "clona", "zapiz", "rivotril"]),
    "klonopin": ("2598", "clonazepam", ["clonazepam"]),
    "rivotril": ("2598", "clonazepam", ["clonazepam"]),
    "lorazepam": ("6470", "lorazepam", ["ativan", "larpose", "trapex"]),
    "ativan": ("6470", "lorazepam", ["lorazepam"]),
    "codeine": ("2670", "codeine", ["codectuss", "corex"]),
    "morphine": ("7052", "morphine", ["ms contin"]),
    "dexamethasone": ("3264", "dexamethasone", ["decadron", "dexona"]),
    "dexona": ("3264", "dexamethasone", ["dexamethasone"]),
    "prednisolone": ("8640", "prednisolone", ["omnapred", "wysolone"]),
    "wysolone": ("8640", "prednisolone", ["prednisolone"]),
    "prednisone": ("8640", "prednisone", ["deltasone"]),
    "caffeine": ("1886", "caffeine", []),
    "pseudoephedrine": ("8840", "pseudoephedrine", ["sudafed", "sinarest"]),
    "dextromethorphan": ("3289", "dextromethorphan", ["benylin", "delsym", "ascoril-d"]),
    "salbutamol": ("435", "albuterol", ["albuterol", "ventolin", "asthalin"]),
    "albuterol": ("435", "albuterol", ["salbutamol", "ventolin", "asthalin"]),
    "asthalin": ("435", "albuterol", ["salbutamol", "albuterol"]),
}

# Fast in-memory normalization cache for sub-millisecond lookups
_NORMALIZATION_CACHE: Dict[str, NormalizedMedication] = {}


async def normalize_medication_name(entered_name: str) -> NormalizedMedication:
    """
    Resolves an entered brand or generic medication name (Indian or global) to RxCUI and canonical active ingredient.
    Cleans dosage/strength/form before matching. Uses fuzzy matching for typos. Caches results in memory.
    """
    raw_clean = entered_name.strip()
    cache_key = raw_clean.lower()
    if cache_key in _NORMALIZATION_CACHE:
        return _NORMALIZATION_CACHE[cache_key]

    sanitized = sanitize_medication_name(raw_clean)
    if not sanitized:
        sanitized = raw_clean.lower()

    res: Optional[NormalizedMedication] = None

    # 1. Check local canonical dictionary first using sanitized name
    if sanitized in KNOWN_CANONICAL_MAP:
        rxcui, canonical, syns = KNOWN_CANONICAL_MAP[sanitized]
        all_syns = list(set([sanitized, canonical] + syns))
        res = NormalizedMedication(
            entered_name=raw_clean,
            canonical_name=canonical,
            rxcui=rxcui,
            synonyms=all_syns,
        )

    # Check un-sanitized lowercase just in case
    low_raw = raw_clean.lower()
    if not res and low_raw in KNOWN_CANONICAL_MAP:
        rxcui, canonical, syns = KNOWN_CANONICAL_MAP[low_raw]
        all_syns = list(set([low_raw, canonical] + syns))
        res = NormalizedMedication(
            entered_name=raw_clean,
            canonical_name=canonical,
            rxcui=rxcui,
            synonyms=all_syns,
        )

    # 1b. Fuzzy match against local canonical dictionary for typos (e.g. "ibprophen", "lithum")
    if not res:
        close_matches = difflib.get_close_matches(sanitized, KNOWN_CANONICAL_MAP.keys(), n=1, cutoff=0.65)
        if close_matches:
            match_key = close_matches[0]
            rxcui, canonical, syns = KNOWN_CANONICAL_MAP[match_key]
            all_syns = list(set([sanitized, match_key, canonical] + syns))
            logger.info(f"Fuzzy matched typo '{sanitized}' -> '{match_key}' (canonical='{canonical}')")
            res = NormalizedMedication(
                entered_name=raw_clean,
                canonical_name=canonical,
                rxcui=rxcui,
                synonyms=all_syns,
            )

    # 2. Try RxNav NIH REST API with sanitized name if not found in local dictionary
    if not res:
        try:
            async with httpx.AsyncClient(timeout=2.5) as client:
                url = f"{settings.RXNORM_BASE_URL}/rxcui.json"
                resp = await client.get(url, params={"name": sanitized})
                if resp.status_code == 200:
                    data = resp.json()
                    id_group = data.get("idGroup", {})
                    rx_list = id_group.get("rxnormId", [])
                    if rx_list:
                        rxcui = rx_list[0]
                        ing_url = f"{settings.RXNORM_BASE_URL}/rxcui/{rxcui}/allrelated.json"
                        ing_resp = await client.get(ing_url)
                        canonical_name = sanitized
                        syn_list = [sanitized]
                        if ing_resp.status_code == 200:
                            ing_data = ing_resp.json()
                            concept_groups = ing_data.get("allRelatedGroup", {}).get("conceptGroup", [])
                            for group in concept_groups:
                                if group.get("tty") in ["IN", "PIN"]:
                                    concepts = group.get("conceptProperties", [])
                                    if concepts:
                                        canonical_name = concepts[0].get("name", sanitized).lower()
                                        syn_list.extend([c.get("name", "").lower() for c in concepts if c.get("name")])
                                        break
                        
                        res = NormalizedMedication(
                            entered_name=raw_clean,
                            canonical_name=canonical_name,
                            rxcui=rxcui,
                            synonyms=list(set(syn_list)),
                        )

                if not res:
                    approx_url = f"{settings.RXNORM_BASE_URL}/approximateTerm.json"
                    approx_resp = await client.get(approx_url, params={"term": sanitized, "maxEntries": 1})
                    if approx_resp.status_code == 200:
                        approx_data = approx_resp.json()
                        candidates = approx_data.get("approximateGroup", {}).get("candidate", [])
                        if candidates:
                            first = candidates[0]
                            rxcui = first.get("rxcui", "0000")
                            canonical_name = sanitize_medication_name(first.get("name", sanitized)) or sanitized
                            res = NormalizedMedication(
                                entered_name=raw_clean,
                                canonical_name=canonical_name,
                                rxcui=rxcui,
                                synonyms=[sanitized],
                            )

        except Exception as e:
            logger.warning(f"RxNorm API call failed for '{raw_clean}': {e}. Using sanitized string.")

    # 3. Clean fallback
    if not res:
        res = NormalizedMedication(
            entered_name=raw_clean,
            canonical_name=sanitized,
            rxcui="00000",
            synonyms=[sanitized],
        )

    _NORMALIZATION_CACHE[cache_key] = res
    return res


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
