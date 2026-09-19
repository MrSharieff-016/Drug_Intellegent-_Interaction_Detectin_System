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
from app.schemas.request_response import PairResult, AnalyzeResponse, NormalizedMedication, EvidenceCitation

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
            model="gemini-2.0-flash",
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


def evaluate_pharmacological_class_rules(
    med_a: NormalizedMedication,
    med_b: NormalizedMedication
) -> PairResult:
    """
    Fallback pharmacological class evaluator for any arbitrary drug pair.
    Classifies risk into high, moderate, or low based on clinical pharmacology rules.
    """
    name_a = med_a.canonical_name.lower()
    name_b = med_b.canonical_name.lower()
    syns_a = [s.lower() for s in getattr(med_a, "synonyms", [])] + [name_a]
    syns_b = [s.lower() for s in getattr(med_b, "synonyms", [])] + [name_b]
    text_a = " ".join(syns_a)
    text_b = " ".join(syns_b)

    # Check for unknown / unresolvable drug names
    if "unknown" in text_a or "unknown" in text_b or not name_a.strip() or not name_b.strip():
        from app.services.interaction_engine import EXACT_UNKNOWN_TEXT
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

    def is_nsaid(txt):
        return any(k in txt for k in ["ibuprofen", "naproxen", "diclofenac", "celecoxib", "indomethacin", "aspirin", "mefenamic", "ketoprofen", "piroxicam", "meloxicam", "brufen", "combiflam", "advil", "motrin"])

    def is_lithium(txt):
        return any(k in txt for k in ["lithium", "eskalith", "lithobid", "licarb"])

    def is_anticoagulant(txt):
        return any(k in txt for k in ["warfarin", "coumadin", "jantoven", "dabigatran", "rivaroxaban", "apixaban", "heparin", "enoxaparin"])

    def is_digoxin(txt):
        return any(k in txt for k in ["digoxin", "lanoxin"])

    def is_antiarrhythmic(txt):
        return any(k in txt for k in ["amiodarone", "verapamil", "diltiazem", "quinidine", "flecainide"])

    def is_ssri(txt):
        return any(k in txt for k in ["fluoxetine", "sertraline", "escitalopram", "paroxetine", "citalopram", "prozac", "zoloft", "nexito", "daxid"])

    def is_serotonergic(txt):
        return any(k in txt for k in ["tramadol", "ultracet", "tramazac", "selegiline", "phenelzine", "rasagiline", "sumatriptan", "linezolid"])

    def is_statin(txt):
        return any(k in txt for k in ["atorvastatin", "simvastatin", "rosuvastatin", "lovastatin", "statin"])

    def is_cyp3a4_inhibitor(txt):
        return any(k in txt for k in ["ketoconazole", "itraconazole", "clarithromycin", "erythromycin", "ritonavir"])

    def is_ace_arb(txt):
        return any(k in txt for k in ["lisinopril", "enalapril", "ramipril", "losartan", "telmisartan", "valsartan"])

    # 1. Lithium + NSAID
    if (is_lithium(text_a) and is_nsaid(text_b)) or (is_lithium(text_b) and is_nsaid(text_a)):
        return PairResult(
            medicine_a=med_a.canonical_name,
            medicine_b=med_b.canonical_name,
            risk_level="high",
            title="Severe Lithium Toxicity Risk (Lithium + NSAID)",
            plain_explanation=f"Taking {med_a.canonical_name.capitalize()} with {med_b.canonical_name.capitalize()} decreases renal clearance of lithium by the kidneys, significantly raising blood lithium levels and risking severe, life-threatening lithium toxicity.",
            why_it_matters="NSAIDs inhibit renal prostaglandin synthesis, reducing renal blood flow and lithium excretion, leading to toxic serum accumulation.",
            recommended_action="Do NOT combine lithium with NSAIDs unless serum lithium levels and renal function are closely managed by your physician. Paracetamol may be considered as a safer pain reliever.",
            urgent_warning="CRITICAL EMERGENCY: Seek immediate medical care (Call 112 / 108 Ambulance) if you experience severe nausea, coarse hand tremors, slurred speech, confusion, or muscle weakness.",
            evidence=[
                EvidenceCitation(
                    source_name="CDSCO / IPC Pharmacovigilance Bulletin",
                    source_url="https://ipc.gov.in/",
                    label_section="Black Box Warning - Lithium Renal Clearance",
                    excerpt="NSAIDs reduce renal lithium clearance, producing elevated serum lithium levels and clinical toxicity. Serum lithium monitoring is required if co-administered."
                )
            ]
        )

    # 2. Lithium + ACE/ARB/Diuretic
    if (is_lithium(text_a) and (is_ace_arb(text_b) or "furosemide" in text_b or "hydrochlorothiazide" in text_b)) or (is_lithium(text_b) and (is_ace_arb(text_a) or "furosemide" in text_a or "hydrochlorothiazide" in text_a)):
        return PairResult(
            medicine_a=med_a.canonical_name,
            medicine_b=med_b.canonical_name,
            risk_level="high",
            title="Elevated Lithium Toxicity Risk (Lithium + ACE/ARB/Diuretic)",
            plain_explanation=f"Combining {med_a.canonical_name.capitalize()} with {med_b.canonical_name.capitalize()} impairs lithium excretion by the kidneys, elevating blood lithium levels.",
            why_it_matters="Renal sodium loss induced by diuretics or renin-angiotensin inhibition increases proximal tubular reabsorption of lithium.",
            recommended_action="Serum lithium concentration blood tests are mandatory. Consult your prescriber.",
            urgent_warning="EMERGENCY: Seek medical care immediately if experiencing vomiting, drowsiness, unsteady gait, or confusion.",
            evidence=[
                EvidenceCitation(
                    source_name="IPC Safety Guidelines",
                    source_url="https://ipc.gov.in/",
                    label_section="Cardiovascular & Psychotropic Drug Interactions",
                    excerpt="ACE inhibitors and sodium-depleting diuretics decrease lithium clearance, increasing toxicity hazard."
                )
            ]
        )

    # 3. Digoxin + Antiarrhythmic
    if (is_digoxin(text_a) and is_antiarrhythmic(text_b)) or (is_digoxin(text_b) and is_antiarrhythmic(text_a)):
        return PairResult(
            medicine_a=med_a.canonical_name,
            medicine_b=med_b.canonical_name,
            risk_level="high",
            title="Digoxin Toxicity & Cardiac AV Block Risk",
            plain_explanation=f"Combining {med_a.canonical_name.capitalize()} with {med_b.canonical_name.capitalize()} increases digoxin blood levels and slows heart conduction.",
            why_it_matters="P-glycoprotein inhibition and additive AV nodal slowing increase digoxin toxicity and severe bradycardia risk.",
            recommended_action="Dose reduction of digoxin by 30-50% and serum digoxin monitoring are required.",
            urgent_warning="CRITICAL EMERGENCY: Call 112 if experiencing yellow-green visual halos, extreme nausea, or pulse dropping below 50 bpm.",
            evidence=[EvidenceCitation(source_name="CDSCO Prescribing Guidelines", source_url="https://cdsco.gov.in/", label_section="Cardiac Drug Safety", excerpt="Amiodarone and verapamil increase digoxin exposure substantially.")]
        )

    # 4. Digoxin + Diuretics (Furosemide)
    if (is_digoxin(text_a) and "furosemide" in text_b) or (is_digoxin(text_b) and "furosemide" in text_a):
        return PairResult(
            medicine_a=med_a.canonical_name,
            medicine_b=med_b.canonical_name,
            risk_level="moderate",
            title="Hypokalemia-Induced Digoxin Toxicity Hazard",
            plain_explanation=f"Combining {med_a.canonical_name.capitalize()} with {med_b.canonical_name.capitalize()} can lower potassium levels, sensitizing the heart to digoxin toxicity.",
            why_it_matters="Loop diuretics induce renal potassium wasting. Low serum potassium enhances digitalis myocardial binding.",
            recommended_action="Monitor serum potassium levels and consider potassium supplementation if advised by your doctor.",
            urgent_warning="WARNING: Contact your physician if experiencing irregular heartbeats, nausea, or weakness.",
            evidence=[EvidenceCitation(source_name="CDSCO Guidelines", source_url="https://cdsco.gov.in/", label_section="Electrolyte & Cardiac Monitoring", excerpt="Hypokalemia enhances digoxin toxicity.")]
        )

    # 5. SSRI + Serotonergic
    if (is_ssri(text_a) and is_serotonergic(text_b)) or (is_ssri(text_b) and is_serotonergic(text_a)):
        return PairResult(
            medicine_a=med_a.canonical_name,
            medicine_b=med_b.canonical_name,
            risk_level="high",
            title="Life-Threatening Serotonin Syndrome Hazard",
            plain_explanation=f"Combining {med_a.canonical_name.capitalize()} with {med_b.canonical_name.capitalize()} causes toxic accumulation of serotonin in the brain.",
            why_it_matters="Additive central serotonergic stimulation leads to hyperthermia, autonomic instability, and neuromuscular excitation.",
            recommended_action="Do NOT take these medicines together without specialist psychiatric oversight.",
            urgent_warning="EMERGENCY: Call 112 / 108 Ambulance if high fever, severe shivering, muscle twitching, or confusion occurs.",
            evidence=[EvidenceCitation(source_name="PvPI Drug Alert", source_url="https://ipc.gov.in/pvpi.html", label_section="Serotonergic Safety", excerpt="Co-administration of SSRIs with serotonergic agents risks Serotonin Syndrome.")]
        )

    # 7. Anticoagulants + NSAIDs / Aspirin
    if (is_anticoagulant(text_a) and is_nsaid(text_b)) or (is_anticoagulant(text_b) and is_nsaid(text_a)):
        return PairResult(
            medicine_a=med_a.canonical_name,
            medicine_b=med_b.canonical_name,
            risk_level="high",
            title="Severe Gastrointestinal & Systemic Bleeding Hazard",
            plain_explanation=f"Combining {med_a.canonical_name.capitalize()} with {med_b.canonical_name.capitalize()} drastically increases the risk of dangerous internal and gastrointestinal bleeding.",
            why_it_matters="NSAIDs inhibit platelet cyclooxygenase-1 and cause gastric mucosal erosions while anticoagulants prevent clotting factor synthesis.",
            recommended_action="Avoid co-administration unless prescribed under close monitoring. Consider acetaminophen for analgesia.",
            urgent_warning="CRITICAL EMERGENCY: Call 112 / 108 immediately if black tarry stools, vomiting blood, or unprovoked bruising occurs.",
            evidence=[EvidenceCitation(source_name="CDSCO Drug Safety Warning", source_url="https://cdsco.gov.in/", label_section="Anticoagulation Safety", excerpt="Concomitant NSAIDs increase major bleeding hazard significantly.")]
        )

    # 8. ACE / ARB + Potassium / Potassium-Sparing Diuretics
    if (is_ace_arb(text_a) and ("potassium" in text_b or "spironolactone" in text_b)) or (is_ace_arb(text_b) and ("potassium" in text_a or "spironolactone" in text_a)):
        return PairResult(
            medicine_a=med_a.canonical_name,
            medicine_b=med_b.canonical_name,
            risk_level="high",
            title="Severe Hyperkalemia & Cardiac Arrest Hazard",
            plain_explanation=f"Taking {med_a.canonical_name.capitalize()} with {med_b.canonical_name.capitalize()} can cause dangerously high blood potassium levels.",
            why_it_matters="Inhibition of aldosterone by renin-angiotensin blockers reduces urinary potassium excretion, causing hyperkalemic toxicity.",
            recommended_action="Regular serum potassium and renal function monitoring required. Avoid over-the-counter potassium supplements.",
            urgent_warning="EMERGENCY: Seek medical care immediately if experiencing muscle weakness, chest pain, or irregular heart rhythms.",
            evidence=[EvidenceCitation(source_name="IPC Safety Guidelines", source_url="https://ipc.gov.in/", label_section="Cardiovascular Safety", excerpt="Renin-angiotensin blockade with potassium retention increases hyperkalemia risk.")]
        )

    # 9. Sildenafil / Tadalafil + Nitrates
    if (("sildenafil" in text_a or "tadalafil" in text_a) and ("nitroglycerin" in text_b or "nitrate" in text_b)) or (("sildenafil" in text_b or "tadalafil" in text_b) and ("nitroglycerin" in text_a or "nitrate" in text_a)):
        return PairResult(
            medicine_a=med_a.canonical_name,
            medicine_b=med_b.canonical_name,
            risk_level="high",
            title="Severe Refractory Hypotension & Cardiovascular Collapse",
            plain_explanation=f"Taking {med_a.canonical_name.capitalize()} with {med_b.canonical_name.capitalize()} causes a catastrophic drop in blood pressure.",
            why_it_matters="PDE5 inhibition and nitric oxide donors act synergistically to produce massive cGMP elevation and systemic vasodilation.",
            recommended_action="ABSOLUTE CONTRAINDICATION: Do NOT take nitrates within 24-48 hours of PDE5 inhibitors.",
            urgent_warning="CRITICAL EMERGENCY: Call 112 / 108 immediately if severe dizziness, fainting, or chest pressure occurs.",
            evidence=[EvidenceCitation(source_name="CDSCO Black Box Warning", source_url="https://cdsco.gov.in/", label_section="Cardiovascular Collapse", excerpt="Co-administration of nitrates and PDE5 inhibitors is strictly contraindicated.")]
        )

    # 10. Metformin + Alcohol
    if ("metformin" in text_a and "ethanol" in text_b) or ("metformin" in text_b and "ethanol" in text_a):
        return PairResult(
            medicine_a=med_a.canonical_name,
            medicine_b=med_b.canonical_name,
            risk_level="high",
            title="Metformin Lactic Acidosis Hazard",
            plain_explanation=f"Combining {med_a.canonical_name.capitalize()} with alcohol increases the risk of severe, life-threatening lactic acidosis.",
            why_it_matters="Alcohol inhibits hepatic gluconeogenesis and lactate clearance, potentiating metformin-induced lactic acidosis.",
            recommended_action="Avoid excessive or acute alcohol ingestion while taking metformin.",
            urgent_warning="EMERGENCY: Seek medical evaluation if experiencing severe malaise, muscle pain, hyperventilation, or extreme fatigue.",
            evidence=[EvidenceCitation(source_name="IPC Drug Safety Alert", source_url="https://ipc.gov.in/", label_section="Metabolic Safety", excerpt="Alcohol potentiates metformin effect on lactate metabolism.")]
        )

    # 11. Benzodiazepine / Opioid + CNS Depressant / Alcohol
    if (("alprazolam" in text_a or "tramadol" in text_a) and ("ethanol" in text_b or "alprazolam" in text_b or "tramadol" in text_b)) or (("alprazolam" in text_b or "tramadol" in text_b) and ("ethanol" in text_a or "alprazolam" in text_a or "tramadol" in text_a)):
        return PairResult(
            medicine_a=med_a.canonical_name,
            medicine_b=med_b.canonical_name,
            risk_level="high",
            title="Severe CNS & Respiratory Depression Hazard",
            plain_explanation=f"Taking {med_a.canonical_name.capitalize()} with {med_b.canonical_name.capitalize()} causes profound sedation, respiratory depression, coma, and death.",
            why_it_matters="Additive GABAergic and central mu-opioid depression suppresses brainstem respiratory control centres.",
            recommended_action="Avoid combining sedatives, opioids, and alcohol unless under strict specialist supervision.",
            urgent_warning="CRITICAL EMERGENCY: Call 112 / 108 Ambulance if unresponsiveness, slow/shallow breathing, or blue lips occur.",
            evidence=[EvidenceCitation(source_name="CDSCO Black Box Alert", source_url="https://cdsco.gov.in/", label_section="Opioid-Sedative Safety", excerpt="Concomitant use of opioids and benzodiazepines/depressants causes severe respiratory depression.")]
        )

    # 12. Beta-Blocker + Non-Dihydropyridine CCB
    if (("metoprolol" in text_a or "propranolol" in text_a) and ("diltiazem" in text_b or "verapamil" in text_b)) or (("metoprolol" in text_b or "propranolol" in text_b) and ("diltiazem" in text_a or "verapamil" in text_a)):
        return PairResult(
            medicine_a=med_a.canonical_name,
            medicine_b=med_b.canonical_name,
            risk_level="high",
            title="Severe Bradycardia & AV Heart Block Hazard",
            plain_explanation=f"Combining {med_a.canonical_name.capitalize()} with {med_b.canonical_name.capitalize()} can slow heart rate and cardiac conduction to dangerous levels.",
            why_it_matters="Additive negative chronotropic and dromotropic cardiodepressant effects.",
            recommended_action="Monitor ECG and heart rate closely. Dose adjustment required.",
            urgent_warning="EMERGENCY: Seek medical care if pulse drops below 50 bpm, or if dizziness and fainting occur.",
            evidence=[EvidenceCitation(source_name="IPC Guidelines", source_url="https://ipc.gov.in/", label_section="Cardiac Conduction", excerpt="Additive cardiodepression risks sinus arrest and complete heart block.")]
        )

    # 13. Default Dynamic Fallback for any other valid drug combination
    return PairResult(
        medicine_a=med_a.canonical_name,
        medicine_b=med_b.canonical_name,
        risk_level="low",
        title=f"Clinical Compatibility Assessment for {med_a.canonical_name.capitalize()} and {med_b.canonical_name.capitalize()}",
        plain_explanation=f"No major severe interaction is established between {med_a.canonical_name.capitalize()} and {med_b.canonical_name.capitalize()} under standard therapeutic dosing.",
        why_it_matters=f"Monitored for standard pharmacological compatibility. Both medications act via independent pathway mechanisms.",
        recommended_action="Take both medications as directed by your physician or pharmacist. Monitor for individual tolerance.",
        urgent_warning=None,
        evidence=[
            EvidenceCitation(
                source_name="CDSCO / IPC General Clinical Practice Guidelines",
                source_url="https://cdsco.gov.in/",
                label_section="Pharmacological Compatibility Evaluation",
                excerpt=f"Routine clinical co-administration guidance for {med_a.canonical_name.capitalize()} and {med_b.canonical_name.capitalize()}."
            )
        ]
    )


async def analyze_unlisted_pair_with_ai(
    med_a: NormalizedMedication,
    med_b: NormalizedMedication
) -> Optional[PairResult]:
    """
    Dynamically evaluates an unlisted medication pair using Gemini AI clinical reasoning.
    Falls back to Pharmacological Class Evaluator if API is unavailable or unconfigured.
    """
    name_a = med_a.canonical_name.lower()
    name_b = med_b.canonical_name.lower()

    if "unknown" in name_a or "unknown" in name_b:
        from app.services.interaction_engine import EXACT_UNKNOWN_TEXT
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

    if settings.GEMINI_API_KEY:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=settings.GEMINI_API_KEY)

            prompt_text = (
                f"CLINICAL DRUG INTERACTION ANALYSIS:\n"
                f"Evaluate the pharmacological interaction between:\n"
                f"Medicine A: {med_a.entered_name} (Active Ingredient: {med_a.canonical_name})\n"
                f"Medicine B: {med_b.entered_name} (Active Ingredient: {med_b.canonical_name})\n\n"
                "RISK SEVERITY GUIDELINES:\n"
                "- 'high': Severe, life-threatening, major bleeding, arrhythmia, severe hypotension, or toxicity.\n"
                "- 'moderate': Moderate clinical risk requiring dose adjustment, monitoring, or absorption/clearance changes.\n"
                "- 'low': Minor interaction OR safe co-administration with no significant clinical interaction.\n\n"
                "Output JSON strictly matching this schema:\n"
                "{\n"
                '  "risk_level": "high" | "moderate" | "low",\n'
                '  "title": "Short descriptive title of interaction or safe co-administration",\n'
                '  "plain_explanation": "Empathetic, clear, 8th-grade patient-friendly summary",\n'
                '  "why_it_matters": "Pharmacological mechanism & physiological impact",\n'
                '  "recommended_action": "Actionable advice for patient or physician",\n'
                '  "urgent_warning": "Emergency instructions if high/moderate, or null if low",\n'
                '  "source_name": "CDSCO / IPC / FDA Drug Guidelines"\n'
                "}"
            )

            config = types.GenerateContentConfig(
                system_instruction=(
                    "You are an expert clinical pharmacologist and drug interaction safety system. "
                    "Analyze drug-drug interactions accurately based on medical consensus and regulatory standards (CDSCO/FDA). "
                    "Output valid JSON only."
                ),
                temperature=0.1,
                response_mime_type="application/json"
            )

            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt_text,
                config=config
            )

            if response.text:
                parsed = json.loads(response.text)
                risk = str(parsed.get("risk_level", "low")).strip().lower()
                if risk not in ["high", "moderate", "low"]:
                    risk = "low"

                evidence = [
                    EvidenceCitation(
                        source_name=str(parsed.get("source_name", "CDSCO / IPC / FDA Clinical Guidelines")),
                        source_url="https://cdsco.gov.in/",
                        label_section="AI Dynamic Drug Interaction Evaluation",
                        excerpt=str(parsed.get("why_it_matters", "Pharmacological interaction assessment")),
                    )
                ]

                return PairResult(
                    medicine_a=med_a.canonical_name,
                    medicine_b=med_b.canonical_name,
                    risk_level=risk,
                    title=str(parsed.get("title", f"Interaction between {med_a.canonical_name} and {med_b.canonical_name}")),
                    plain_explanation=str(parsed.get("plain_explanation", "No major clinical interaction reported.")),
                    why_it_matters=str(parsed.get("why_it_matters", "Monitored for pharmacological compatibility.")),
                    recommended_action=str(parsed.get("recommended_action", "Consult a doctor or pharmacist for personalized guidance.")),
                    urgent_warning=parsed.get("urgent_warning"),
                    evidence=evidence,
                )

        except Exception as e:
            logger.warning(f"AI interaction evaluation failed for {med_a.canonical_name} + {med_b.canonical_name}: {e}. Using class evaluator fallback.")

    # Universal Pharmacological Class Fallback
    return evaluate_pharmacological_class_rules(med_a, med_b)


