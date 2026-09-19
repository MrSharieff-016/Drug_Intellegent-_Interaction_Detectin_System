"""
Seed Demo Interaction Data Script for MedSafe AI (Indian Medical & Emergency Standards).
Populates clinically accurate drug interaction rules and package label chunks citing
CDSCO, Indian Pharmacopoeia Commission (IPC), PvPI, and AIIMS National Poison Information Centre guidelines.
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
        "mechanism": "Increased risk of major gastrointestinal hemorrhage and systemic bleeding due to combined anticoagulant and antiplatelet/NSAID effects.",
        "patient_friendly_summary": "Taking warfarin with ibuprofen (or Brufen/Combiflam) significantly increases the risk of stomach bleeding and internal hemorrhaging.",
        "recommended_action_template": "Consult a registered doctor or clinical pharmacist immediately before combining these medicines. Paracetamol (Dolo/Crocin) at safe doses may be recommended instead.",
        "urgent_warning_template": "EMERGENCY: Call Indian National Emergency 112 or visit an emergency room immediately if you notice blood in vomit, black tarry stools, or severe unexplained bruising.",
        "source": {
            "source_name": "CDSCO / IPC PvPI Guidelines",
            "source_url": "https://cdsco.gov.in/",
            "title": "CDSCO Approved Package Insert - Warfarin & NSAID Interactions",
            "section_name": "Drug Interactions & Warnings"
        }
    },
    {
        "ingredient_a": "nitroglycerin",
        "ingredient_b": "sildenafil",
        "risk_level": "high",
        "mechanism": "Potentiation of nitric oxide vasodilatory effect causing severe, life-threatening hypotension and cardiac shock.",
        "patient_friendly_summary": "Combining nitroglycerin (Nitrolong/Angiplat) with sildenafil (Manforce/Penegra/Caverta) can cause a sudden, critical drop in blood pressure.",
        "recommended_action_template": "Do NOT take sildenafil if you are using nitroglycerin or nitrate heart medications. Consult a cardiologist or physician urgently.",
        "urgent_warning_template": "CRITICAL EMERGENCY: Call 112 (National Emergency Number, India) or 108 Ambulance immediately if chest pain, fainting, or dizziness occurs.",
        "source": {
            "source_name": "CDSCO India Prescribing Guidelines",
            "source_url": "https://cdsco.gov.in/",
            "title": "CDSCO Sildenafil & Nitrate Co-administration Contraindications",
            "section_name": "Contraindications"
        }
    },
    {
        "ingredient_a": "lisinopril",
        "ingredient_b": "spironolactone",
        "risk_level": "high",
        "mechanism": "Synergistic renal potassium retention leading to severe hyperkalemia and dangerous cardiac arrhythmia risk.",
        "patient_friendly_summary": "Combining an ACE inhibitor (Lisinopril/Listril) with a potassium-sparing diuretic (Spironolactone/Aldactone) can cause dangerously high blood potassium levels.",
        "recommended_action_template": "Routine serum potassium blood tests are required by your prescribing doctor. Avoid potassium-rich dietary supplements.",
        "urgent_warning_template": "Contact your doctor or visit a hospital urgently if you experience muscle weakness, numbness, or irregular heart palpitations.",
        "source": {
            "source_name": "Indian Pharmacopoeia Commission (IPC)",
            "source_url": "https://ipc.gov.in/",
            "title": "IPC Safety Alert: ACE Inhibitor & Potassium Sparing Diuretic Hyperkalemia",
            "section_name": "Warnings and Precautions"
        }
    },
    {
        "ingredient_a": "sertraline",
        "ingredient_b": "tramadol",
        "risk_level": "high",
        "mechanism": "Excessive central serotonergic neurotransmission leading to life-threatening Serotonin Syndrome.",
        "patient_friendly_summary": "Combining sertraline (Daxid/Sertal) with tramadol (Ultracet/Tramazac) can cause Serotonin Syndrome.",
        "recommended_action_template": "Inform your physician before taking opioid pain relievers alongside SSRI antidepressant medications.",
        "urgent_warning_template": "Seek immediate emergency evaluation if high fever, severe shivering, muscle twitching, confusion, or rapid heartbeat occurs.",
        "source": {
            "source_name": "PvPI (Pharmacovigilance Programme of India)",
            "source_url": "https://ipc.gov.in/pvpi.html",
            "title": "PvPI Drug Safety Alert - Serotonin Syndrome Warning",
            "section_name": "Warnings and Precautions"
        }
    },
    {
        "ingredient_a": "metformin",
        "ingredient_b": "iodinated contrast media",
        "risk_level": "moderate",
        "mechanism": "Contrast-induced acute renal dysfunction leading to metformin renal clearance reduction and lactic acidosis.",
        "patient_friendly_summary": "Iodinated contrast dye used during CT scans or angiograms can temporarily impair kidney function, raising metformin toxicity risks.",
        "recommended_action_template": "Metformin (Glycomet/Obimet) should generally be withheld 48 hours prior to or at the time of contrast imaging under medical supervision.",
        "urgent_warning_template": "Report unusual muscle severe pain, difficulty breathing, or severe fatigue to your physician.",
        "source": {
            "source_name": "CDSCO / AIIMS Clinical Protocol",
            "source_url": "https://cdsco.gov.in/",
            "title": "Metformin Radiocontrast Administration Protocol",
            "section_name": "Warnings and Precautions"
        }
    },
    {
        "ingredient_a": "amlodipine",
        "ingredient_b": "simvastatin",
        "risk_level": "moderate",
        "mechanism": "Amlodipine inhibits CYP3A4-mediated clearance, elevating simvastatin exposure and rhabdomyolysis risk.",
        "patient_friendly_summary": "Taking amlodipine (Stamlo/Amlovas) with simvastatin (Simvotin) increases blood levels of simvastatin, elevating muscle damage risks.",
        "recommended_action_template": "Daily dose of simvastatin should not exceed 20 mg when taken concurrently with amlodipine per clinical guidelines.",
        "urgent_warning_template": "Contact your prescriber if unexplained muscle tenderness, weakness, or dark tea-colored urine develops.",
        "source": {
            "source_name": "Indian Pharmacopoeia Commission (IPC)",
            "source_url": "https://ipc.gov.in/",
            "title": "Simvastatin Dosing Restrictions with Amlodipine",
            "section_name": "Drug Interactions"
        }
    },
    {
        "ingredient_a": "acetaminophen",
        "ingredient_b": "aspirin",
        "risk_level": "low",
        "mechanism": "Minor cumulative gastric mucosal irritation; low clinical interaction risk at standard therapeutic doses.",
        "patient_friendly_summary": "Low interaction risk at normal recommended doses (e.g. Paracetamol/Dolo 650 with Ecosprin 75).",
        "recommended_action_template": "Do not exceed maximum recommended daily dosage limits (e.g. 3000-4000 mg paracetamol daily).",
        "urgent_warning_template": None,
        "source": {
            "source_name": "CDSCO Approved OTC Guidelines",
            "source_url": "https://cdsco.gov.in/",
            "title": "Analgesic Combination Guidelines - IPC / CDSCO",
            "section_name": "Patient Counseling Information"
        }
    }
]

DEMO_SOURCE_CHUNKS = [
    {
        "ingredient_names": ["warfarin", "ibuprofen", "brufen", "combiflam", "warf"],
        "section_name": "Drug Interactions - Anticoagulants and NSAIDs (CDSCO)",
        "content": (
            "Concomitant administration of Warfarin with NSAIDs like Ibuprofen (Brufen, Combiflam) severely "
            "elevates bleeding risk. Inhibition of platelet aggregation by NSAIDs combined with Warfarin "
            "hypoprothrombinemia significantly increases prothrombin time and gastrointestinal bleeding hazard. "
            "Monitoring of INR is essential if combined therapy is deemed clinically necessary. Emergency assistance (Call 112 / AIIMS NPIC 1800-116-117) "
            "is advised upon signs of internal hemorrhage."
        ),
        "source_name": "CDSCO / IPC PvPI Guidelines",
        "source_url": "https://cdsco.gov.in/",
        "source_title": "CDSCO Package Insert Guidelines - Section 7 Drug Interactions"
    },
    {
        "ingredient_names": ["sildenafil", "nitroglycerin", "manforce", "penegra", "caverta", "nitrolong"],
        "section_name": "Contraindications - Nitrates Coadministration (CDSCO)",
        "content": (
            "Consistent with its known effects on the nitric oxide/cGMP pathway, Sildenafil (Manforce, Penegra, Caverta) "
            "potentiates hypotensive effects of nitrates. Administration of Sildenafil to patients using organic nitrates "
            "like Nitroglycerin (Nitrolong, Angiplat) or Isosorbide in any form is CONTRAINDICATED. Severe profound hypotension, "
            "cardiovascular collapse, or acute myocardial infarction can result. Emergency hotline: Call 112 / 108 Ambulance."
        ),
        "source_name": "CDSCO Approved Label",
        "source_url": "https://cdsco.gov.in/",
        "source_title": "CDSCO Prescribing Information - Sildenafil Contraindications"
    },
    {
        "ingredient_names": ["lisinopril", "spironolactone", "listril", "aldactone"],
        "section_name": "Warnings and Precautions - Hyperkalemia Risk (IPC)",
        "content": (
            "Co-administration of Lisinopril (Listril) with potassium-sparing diuretics like Spironolactone (Aldactone) "
            "or potassium supplements can increase serum potassium levels. Severe hyperkalemia may lead to fatal cardiac arrhythmias. "
            "Serum potassium monitoring should be conducted periodically."
        ),
        "source_name": "Indian Pharmacopoeia Commission (IPC)",
        "source_url": "https://ipc.gov.in/",
        "source_title": "IPC Drug Safety Insert - Lisinopril & Spironolactone"
    },
    {
        "ingredient_names": ["sertraline", "tramadol", "daxid", "ultracet", "tramazac"],
        "section_name": "Warnings - Serotonin Syndrome (PvPI)",
        "content": (
            "Development of a life-threatening serotonin syndrome is reported with SSRIs like Sertraline (Daxid), "
            "especially when co-administered with serotonergic drugs including Tramadol (Ultracet, Tramazac). Symptoms "
            "include hyperthermia, muscle rigidity, tremor, confusion, agitation, and autonomic instability."
        ),
        "source_name": "PvPI (Pharmacovigilance Programme of India)",
        "source_url": "https://ipc.gov.in/pvpi.html",
        "source_title": "PvPI Pharmacovigilance Bulletin - Serotonin Syndrome"
    },
    {
        "ingredient_names": ["metformin", "iodinated contrast media", "glycomet", "gluconorm"],
        "section_name": "Warnings - Contrast Induced Renal Impairment",
        "content": (
            "Intravascular administration of iodinated radiocontrast dyes can cause acute alteration of renal function, "
            "associated with lactic acidosis in patients receiving Metformin (Glycomet). Metformin should be temporarily "
            "discontinued at the time of procedure."
        ),
        "source_name": "CDSCO / AIIMS Guidelines",
        "source_url": "https://cdsco.gov.in/",
        "source_title": "AIIMS New Delhi Radiocontrast Guidelines"
    },
    {
        "ingredient_names": ["amlodipine", "simvastatin", "stamlo", "amlovas", "simvotin"],
        "section_name": "Drug Interactions - HMG-CoA Reductase Inhibitor Coadministration",
        "content": (
            "Co-administration of Amlodipine (Stamlo, Amlovas) with Simvastatin (Simvotin) increases systemic exposure "
            "of Simvastatin. Limit Simvastatin dose to 20 mg daily in patients taking Amlodipine concurrently to prevent "
            "myopathy and rhabdomyolysis risks."
        ),
        "source_name": "Indian Pharmacopoeia Commission (IPC)",
        "source_url": "https://ipc.gov.in/",
        "source_title": "IPC Safety Communication - Simvastatin Dosing Limits"
    }
]


def seed_all_demo_data():
    """Seeds demo interaction rules and TF-IDF chunks into local memory / Supabase."""
    logger.info("Seeding Indian standard DDI rules...")
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

    logger.info("Seeding Indian standard source chunks for TF-IDF RAG...")
    for c in DEMO_SOURCE_CHUNKS:
        register_local_source_chunk(
            ingredient_names=c["ingredient_names"],
            section_name=c["section_name"],
            content=c["content"],
            source_name=c["source_name"],
            source_url=c["source_url"],
            source_title=c["source_title"],
        )

    logger.info("Indian standard demo data seeding completed successfully.")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    seed_all_demo_data()
