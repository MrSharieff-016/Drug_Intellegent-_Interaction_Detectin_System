-- MedSafe AI Supabase DDI Rules Seed Migration
-- Populates core clinical drug-drug interaction rules into public.ddi_rules

INSERT INTO public.ddi_rules (
    ingredient_a,
    ingredient_b,
    risk_level,
    mechanism,
    patient_friendly_summary,
    recommended_action_template,
    urgent_warning_template,
    active
) VALUES 
(
    'aspirin',
    'warfarin',
    'high',
    'Concurrent administration of aspirin and warfarin causes synergistic inhibition of haemostasis through additive antiplatelet and anticoagulant pharmacodynamic effects, significantly elevating major GI bleeding and severe hemorrhage risk.',
    'Taking aspirin together with warfarin severely increases your risk of dangerous internal bleeding, stomach hemorrhaging, and severe hematomas.',
    'Do NOT combine aspirin and warfarin unless explicitly prescribed and closely managed by a registered doctor with regular INR blood testing.',
    'CRITICAL EMERGENCY: Call Indian National Emergency 112 or 108 Ambulance immediately if you notice blood in vomit or dark tarry stools.',
    true
),
(
    'ibuprofen',
    'lithium',
    'high',
    'NSAIDs like ibuprofen decrease renal clearance of lithium by inhibiting renal prostaglandin synthesis, leading to significantly elevated serum lithium concentrations and severe lithium toxicity.',
    'Taking lithium together with ibuprofen decreases lithium elimination by your kidneys, severely increasing blood lithium levels and raising risks of dangerous lithium toxicity.',
    'Avoid combining lithium with NSAID pain relievers unless serum lithium concentrations and kidney function are monitored closely by your physician.',
    'CRITICAL EMERGENCY: Call 112 / 108 Ambulance immediately if you experience severe nausea, coarse hand tremors, slurred speech, or confusion.',
    true
),
(
    'ibuprofen',
    'warfarin',
    'high',
    'Increased risk of major gastrointestinal hemorrhage and systemic bleeding due to combined anticoagulant and antiplatelet/NSAID effects.',
    'Taking warfarin with ibuprofen significantly increases the risk of stomach bleeding and internal hemorrhaging.',
    'Consult a registered doctor or clinical pharmacist immediately before combining these medicines.',
    'EMERGENCY: Call Indian National Emergency 112 or visit an emergency room immediately if you notice blood in vomit or black tarry stools.',
    true
),
(
    'nitroglycerin',
    'sildenafil',
    'high',
    'Potentiation of nitric oxide vasodilatory effect causing severe, life-threatening hypotension and cardiac shock.',
    'Combining nitroglycerin with sildenafil can cause a sudden, critical drop in blood pressure.',
    'Do NOT take sildenafil if you are using nitroglycerin or nitrate heart medications.',
    'CRITICAL EMERGENCY: Call 112 or 108 Ambulance immediately if chest pain, fainting, or dizziness occurs.',
    true
),
(
    'lisinopril',
    'spironolactone',
    'high',
    'Synergistic renal potassium retention leading to severe hyperkalemia and dangerous cardiac arrhythmia risk.',
    'Combining Lisinopril with Spironolactone can cause dangerously high blood potassium levels.',
    'Routine serum potassium blood tests are required by your prescribing doctor. Avoid potassium-rich dietary supplements.',
    'Contact your doctor or visit a hospital urgently if you experience muscle weakness, numbness, or irregular heart palpitations.',
    true
),
(
    'sertraline',
    'tramadol',
    'high',
    'Excessive central serotonergic neurotransmission leading to life-threatening Serotonin Syndrome.',
    'Combining sertraline with tramadol can cause Serotonin Syndrome.',
    'Inform your physician before taking opioid pain relievers alongside SSRI antidepressant medications.',
    'Seek immediate emergency evaluation if high fever, severe shivering, muscle twitching, confusion, or rapid heartbeat occurs.',
    true
),
(
    'iodinated contrast media',
    'metformin',
    'moderate',
    'Contrast-induced acute renal dysfunction leading to metformin renal clearance reduction and lactic acidosis.',
    'Iodinated contrast dye used during CT scans can temporarily impair kidney function, raising metformin toxicity risks.',
    'Metformin should generally be withheld 48 hours prior to or at the time of contrast imaging under medical supervision.',
    'Report unusual severe muscle pain, difficulty breathing, or severe fatigue to your physician.',
    true
),
(
    'amlodipine',
    'simvastatin',
    'moderate',
    'Amlodipine inhibits CYP3A4-mediated clearance, elevating simvastatin exposure and rhabdomyolysis risk.',
    'Taking amlodipine with simvastatin increases blood levels of simvastatin, elevating muscle damage risks.',
    'Daily dose of simvastatin should not exceed 20 mg when taken concurrently with amlodipine per clinical guidelines.',
    'Contact your prescriber if unexplained muscle tenderness, weakness, or dark tea-colored urine develops.',
    true
),
(
    'acetaminophen',
    'aspirin',
    'low',
    'Minor cumulative gastric mucosal irritation; low clinical interaction risk at standard therapeutic doses.',
    'Low interaction risk at normal recommended doses.',
    'Do not exceed maximum recommended daily dosage limits (3000-4000 mg paracetamol daily).',
    NULL,
    true
),
(
    'digoxin',
    'furosemide',
    'high',
    'Furosemide-induced hypokalemia severely sensitizes the myocardium to digoxin, predisposing to fatal cardiac arrhythmias and digoxin toxicity.',
    'Taking furosemide with digoxin can lower blood potassium levels, triggering dangerous heart rhythm disturbances.',
    'Regular serum potassium and digoxin concentration monitoring is mandatory by your cardiologist.',
    'CRITICAL EMERGENCY: Seek immediate emergency medical care (Call 112) if experiencing nausea, visual halos, or fluttering heart rate.',
    true
),
(
    'clopidogrel',
    'omeprazole',
    'high',
    'Omeprazole inhibits CYP2C19, preventing metabolic activation of clopidogrel and increasing stent thrombosis / cardiovascular event risk.',
    'Omeprazole blocks the activation of clopidogrel, reducing its blood-thinning protection against heart attack or stroke.',
    'Consult your doctor. Alternative acid reducers like Pantoprazole or H2 blockers are preferred.',
    'Seek emergency medical advice immediately if experiencing severe chest pressure, weakness, or shortness of breath.',
    true
),
(
    'ciprofloxacin',
    'theophylline',
    'high',
    'Ciprofloxacin inhibits hepatic CYP1A2 metabolic clearance of theophylline, raising serum levels and causing severe toxicity, seizures, and arrhythmias.',
    'Taking ciprofloxacin with theophylline can cause toxic blood levels of theophylline leading to severe seizures or heart tremors.',
    'Avoid concurrent use unless serum theophylline monitoring is closely maintained.',
    'EMERGENCY: Call 112 / 108 Ambulance if severe nausea, tremors, rapid pulse, or confusion develops.',
    true
),
(
    'diltiazem',
    'metoprolol',
    'high',
    'Additive AV nodal conduction slowdown and negative inotropy causing severe symptomatic bradycardia, hypotension, and heart block.',
    'Combining metoprolol with diltiazem can excessively slow your heart rate and cause severe low blood pressure.',
    'Requires close clinical heart rate and blood pressure monitoring by your cardiologist.',
    'Seek emergency care immediately if experiencing fainting, extreme dizziness, or pulse dropping below 50 bpm.',
    true
),
(
    'acetaminophen',
    'amoxicillin',
    'low',
    'No significant clinical metabolic or excretion interaction between paracetamol and amoxicillin.',
    'Taking Paracetamol with Amoxicillin is safe and commonly prescribed together for infections accompanied by fever or pain.',
    'Take both medications as directed by your physician.',
    NULL,
    true
),
(
    'atorvastatin',
    'metformin',
    'low',
    'No clinically relevant pharmacokinetic interaction between metformin and atorvastatin; standard safe combination.',
    'Combining Metformin with Atorvastatin is a standard, safe therapeutic regimen for diabetes and cholesterol management.',
    'Continue taking prescribed doses and monitor routine blood glucose and lipid panels.',
    NULL,
    true
),
(
    'acetaminophen',
    'pantoprazole',
    'low',
    'No adverse interaction; pantoprazole provides gastric mucosal protection while acetaminophen acts as a systemic analgesic.',
    'Taking Pantoprazole with Paracetamol is safe and helps protect your stomach lining while relieving fever or pain.',
    'Follow standard dosing instructions provided by your doctor or pharmacist.',
    NULL,
    true
)
ON CONFLICT (ingredient_a, ingredient_b) DO UPDATE SET
    risk_level = EXCLUDED.risk_level,
    mechanism = EXCLUDED.mechanism,
    patient_friendly_summary = EXCLUDED.patient_friendly_summary,
    recommended_action_template = EXCLUDED.recommended_action_template,
    urgent_warning_template = EXCLUDED.urgent_warning_template,
    active = true;
