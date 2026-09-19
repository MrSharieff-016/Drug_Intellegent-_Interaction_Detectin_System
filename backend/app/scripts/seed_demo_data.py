"""
Seed Demo Interaction Data Script for MedSafe AI.
Populates clinically accurate, cited drug interaction rules and package label chunks.
"""

import logging
from app.services.database_service import (
    register_local_ddi_rule,
    register_local_source_chunk,
)

logger = logging.getLogger("medsafe.seed")

DEMO_RULES = [
    {
        "ingredient_a": "warfarin",
        "ingredient_b": "ibuprofen",
        "risk_level": "high",
        "mechanism": "Increased risk of major gastrointestinal and systemic bleeding due to combined anticoagulant and antiplatelet/NSAID effects.",
        "patient_friendly_summary": "Taking warfarin with ibuprofen significantly increases the risk of stomach bleeding and serious hemorrhaging.",
        "recommended_action_template": "Contact a pharmacist or prescriber immediately before combining these medicines. An alternative non-NSAID pain reliever like paracetamol (acetaminophen) may be recommended.",
        "urgent_warning_template": "Seek emergency medical attention if you experience red or black dark tarry stools, coughing up blood, severe dizziness, or unusual bruising.",
        "source": {
            "source_name": "DailyMed / FDA Label",
            "source_url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=warfarin-ibuprofen",
            "title": "Warfarin & Ibuprofen Package Insert - Boxed Warnings & Drug Interactions",
            "section_name": "Drug Interactions & Warnings"
        }
    },
    {
        "ingredient_a": "nitroglycerin",
        "ingredient_b": "sildenafil",
        "risk_level": "high",
        "mechanism": "Potentiation of vasodilatory effect causing severe, life-threatening hypotension and cardiac collapse.",
        "patient_friendly_summary": "Combining nitroglycerin with sildenafil can cause a sudden, dangerous drop in blood pressure.",
        "recommended_action_template": "Do NOT take sildenafil if you are using nitroglycerin or any nitrate medications. Consult your cardiologist or physician immediately.",
        "urgent_warning_template": "EMERGENCY: Call local emergency services (911) immediately if chest pain, fainting, or severe lightheadedness occurs.",
        "source": {
            "source_name": "FDA DailyMed",
            "source_url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=sildenafil-nitrates",
            "title": "Viagra (Sildenafil) FDA Prescribing Information - Contraindications",
            "section_name": "Contraindications"
        }
    },
    {
        "ingredient_a": "lisinopril",
        "ingredient_b": "spironolactone",
        "risk_level": "high",
        "mechanism": "Synergistic potassium retention leading to severe hyperkalemia and cardiac arrhythmia risk.",
        "patient_friendly_summary": "Combining an ACE inhibitor (lisinopril) with a potassium-sparing diuretic (spironolactone) can lead to dangerously high serum potassium levels.",
        "recommended_action_template": "Frequent serum potassium monitoring is required by your healthcare provider. Avoid high-potassium diet supplements.",
        "urgent_warning_template": "Contact your doctor urgently if you experience muscle weakness, numbness, or abnormal irregular heartbeats.",
        "source": {
            "source_name": "DailyMed",
            "source_url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=lisinopril-spironolactone",
            "title": "Lisinopril & Spironolactone Co-administration Guidelines",
            "section_name": "Warnings and Precautions"
        }
    },
    {
        "ingredient_a": "sertraline",
        "ingredient_b": "tramadol",
        "risk_level": "high",
        "mechanism": "Excessive serotonergic activity leading to Serotonin Syndrome.",
        "patient_friendly_summary": "Combining sertraline (an SSRI antidepressant) with tramadol (an opioid analgesic) can cause a serious condition called serotonin syndrome.",
        "recommended_action_template": "Inform your physician before combining pain relief medications with antidepressant therapy.",
        "urgent_warning_template": "Seek prompt medical evaluation if high fever, agitation, shivering, twitching, tremors, or rapid heartbeat develop.",
        "source": {
            "source_name": "FDA DailyMed",
            "source_url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=zoloft-tramadol",
            "title": "Zoloft (Sertraline) Package Insert - Serotonin Syndrome Warning",
            "section_name": "Warnings and Precautions"
        }
    },
    {
        "ingredient_a": "metformin",
        "ingredient_b": "iodinated contrast media",
        "risk_level": "moderate",
        "mechanism": "Contrast-induced acute kidney injury leading to metformin accumulation and lactic acidosis.",
        "patient_friendly_summary": "Iodinated dye used during CT scans or X-ray procedures can temporarily affect kidney function, increasing metformin side effect risks.",
        "recommended_action_template": "Metformin should usually be temporarily withheld prior to or at the time of contrast imaging. Consult your prescribing physician or radiologist.",
        "urgent_warning_template": "Report severe fatigue, muscle pain, difficulty breathing, or abdominal pain to your doctor.",
        "source": {
            "source_name": "DailyMed",
            "source_url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=metformin-contrast",
            "title": "Glucophage (Metformin) Package Insert - Lactic Acidosis Warning",
            "section_name": "Warnings and Precautions"
        }
    },
    {
        "ingredient_a": "amlodipine",
        "ingredient_b": "simvastatin",
        "risk_level": "moderate",
        "mechanism": "Amlodipine increases plasma concentration of simvastatin, increasing myopathy and rhabdomyolysis risk.",
        "patient_friendly_summary": "Taking amlodipine alongside simvastatin can raise the levels of simvastatin in your blood, increasing the risk of muscle breakdown.",
        "recommended_action_template": "Dose adjustment of simvastatin (maximum 20 mg daily when combined with amlodipine) is recommended by FDA guidelines.",
        "urgent_warning_template": "Contact your prescriber if unexplained muscle soreness, tenderness, weakness, or dark-colored urine occurs.",
        "source": {
            "source_name": "FDA Safety Communication",
            "source_url": "https://www.fda.gov/drugs/drug-safety-and-availability/fda-drug-safety-communication-simvastatin-amlodipine",
            "title": "FDA Drug Safety Communication: Simvastatin Dosing Limits",
            "section_name": "Drug Interactions"
        }
    },
    {
        "ingredient_a": "acetaminophen",
        "ingredient_b": "aspirin",
        "risk_level": "low",
        "mechanism": "Minor combined gastrointestinal irritation; low risk at recommended therapeutic dosages.",
        "patient_friendly_summary": "Low risk interaction at standard therapeutic doses, though prolonged combined high doses should be reviewed by a physician.",
        "recommended_action_template": "Ensure you do not exceed daily maximum dose limits for either medication (e.g. 4000 mg max daily acetaminophen).",
        "urgent_warning_template": None,
        "source": {
            "source_name": "DailyMed",
            "source_url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=aspirin-acetaminophen",
            "title": "OTC Analgesic Combination Guidelines",
            "section_name": "Patient Counseling Information"
        }
    }
]

DEMO_SOURCE_CHUNKS = [
    {
        "ingredient_names": ["warfarin", "ibuprofen", "advil", "motrin"],
        "section_name": "Drug Interactions - Anticoagulants and NSAIDs",
        "content": (
            "Concomitant use of Warfarin with Nonsteroidal Anti-inflammatory Drugs (NSAIDs) such as Ibuprofen, "
            "Naproxen, or Aspirin increases the risk of gastrointestinal bleeding. Patients receiving Warfarin "
            "should be instructed of the risk of bleeding with NSAIDs. Inhibition of platelet aggregation by NSAIDs "
            "combined with Warfarin hypoprothrombinemia severely elevates prothrombin time and hemorrhage risk. "
            "Close monitoring of INR is required if combination cannot be avoided."
        ),
        "source_name": "FDA DailyMed",
        "source_url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=warfarin-ibuprofen",
        "source_title": "Warfarin Sodium Prescribing Information - Section 7 Drug Interactions"
    },
    {
        "ingredient_names": ["sildenafil", "nitroglycerin", "viagra", "nitrostat"],
        "section_name": "Contraindications - Nitrates Coadministration",
        "content": (
            "Consistent with its known effects on the nitric oxide/cGMP pathway, Sildenafil (Viagra) was shown to "
            "potentiate the hypotensive effects of nitrates. Administration of Sildenafil to patients who are using "
            "organic nitrates, such as Nitroglycerin, Isosorbide mononitrate, or Isosorbide dinitrate in any form, is "
            "CONTRAINDICATED. Severe profound hypotension, cardiovascular syncope, or acute myocardial infarction can occur."
        ),
        "source_name": "FDA DailyMed",
        "source_url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=sildenafil-nitrates",
        "source_title": "Viagra Official Prescribing Information - Contraindications"
    },
    {
        "ingredient_names": ["lisinopril", "spironolactone", "zestril", "aldactone"],
        "section_name": "Warnings and Precautions - Hyperkalemia Risk",
        "content": (
            "Co-administration of Lisinopril with potassium-sparing diuretics such as Spironolactone, Eplerenone, or "
            "Triamterene, or potassium supplements can increase serum potassium levels. Severe hyperkalemia may lead to "
            "fatal cardiac arrhythmias. Serum potassium levels should be monitored frequently in patients receiving "
            "Lisinopril and Spironolactone concurrently."
        ),
        "source_name": "FDA DailyMed",
        "source_url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=lisinopril-spironolactone",
        "source_title": "Lisinopril Tablets Prescribing Information"
    },
    {
        "ingredient_names": ["sertraline", "tramadol", "zoloft", "ultram"],
        "section_name": "Warnings - Serotonin Syndrome",
        "content": (
            "The development of a potentially life-threatening serotonin syndrome has been reported with SSRIs like "
            "Sertraline, particularly when co-administered with serotonergic drugs including Tramadol, Fentanyl, or "
            "Lithium. Symptoms include agitation, hallucinations, delirium, coma, tachycardia, hyperthermia, muscle rigidity, "
            "tremor, and gastrointestinal distress. Discontinue treatment immediately if serotonin syndrome occurs."
        ),
        "source_name": "FDA DailyMed",
        "source_url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=zoloft-tramadol",
        "source_title": "Zoloft (Sertraline HCl) Prescribing Information"
    },
    {
        "ingredient_names": ["metformin", "iodinated contrast media", "glucophage"],
        "section_name": "Warnings - Contrast Induced Acute Kidney Injury",
        "content": (
            "Intravascular administration of iodinated contrast materials in radiologic studies can lead to an acute alteration "
            "of renal function and has been associated with lactic acidosis in patients receiving Metformin. Metformin should be "
            "discontinued at the time of or prior to the procedure, and withheld for 48 hours subsequent to the procedure."
        ),
        "source_name": "DailyMed",
        "source_url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=metformin-contrast",
        "source_title": "Metformin Hydrochloride Prescribing Information"
    },
    {
        "ingredient_names": ["amlodipine", "simvastatin", "norvasc", "zocor"],
        "section_name": "Drug Interactions - HMG-CoA Reductase Inhibitor Coadministration",
        "content": (
            "Co-administration of Amlodipine with Simvastatin significantly increases the systemic exposure of Simvastatin. "
            "Limit the dose of Simvastatin to 20 mg daily in patients taking Amlodipine concurrently to prevent increased "
            "risk of myopathy, muscle weakness, and severe rhabdomyolysis."
        ),
        "source_name": "FDA DailyMed",
        "source_url": "https://www.fda.gov/drugs/drug-safety-and-availability/fda-drug-safety-communication-simvastatin-amlodipine",
        "source_title": "Norvasc (Amlodipine Besylate) Drug Interactions Insert"
    }
]


def seed_all_demo_data():
    """Seeds demo interaction rules and TF-IDF chunks into local memory / Supabase."""
    logger.info("Seeding demo DDI rules...")
    for r in DEMO_RULES:
        register_local_ddi_rule(
            ing_a=r["ingredient_a"],
            ing_b=r["ingredient_b"],
            risk_level=r["risk_level"],
            mechanism=r["mechanism"],
            patient_friendly_summary=r["patient_friendly_summary"],
            recommended_action_template=r["recommended_action_template"],
            urgent_warning_template=r.get("urgent_warning_template"),
            source_info=r.get("source"),
        )

    logger.info("Seeding demo source chunks for TF-IDF RAG...")
    for c in DEMO_SOURCE_CHUNKS:
        register_local_source_chunk(
            ingredient_names=c["ingredient_names"],
            section_name=c["section_name"],
            content=c["content"],
            source_name=c["source_name"],
            source_url=c["source_url"],
            source_title=c["source_title"],
        )

    logger.info("Demo data seeding completed successfully.")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    seed_all_demo_data()
