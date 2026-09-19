import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Cpu,
  BookOpen,
  PhoneCall,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ExternalLink,
  Hospital,
  Building2
} from 'lucide-react';

export const LimitationsPage: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in pb-16 max-w-4xl mx-auto">
      {/* Title Header */}
      <div className="glass-panel p-8 border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 text-center space-y-3">
        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold uppercase tracking-wider">
          Indian & Bengaluru Emergency Medical Standards
        </span>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          MedSafe AI: Limitations & Bengaluru Emergency Medical Standards
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Comprehensive breakdown of educational prototype boundaries, deterministic decision architecture, Indian drug regulatory frameworks (CDSCO / IPC / PvPI / Karnataka Drugs Control), and Bengaluru emergency medical & poison response protocols.
        </p>
      </div>

      {/* Core Safety Principle */}
      <div className="glass-panel p-6 border-amber-500/40 bg-gradient-to-b from-amber-50/50 to-white dark:from-amber-950/30 dark:to-slate-900 space-y-4">
        <div className="flex items-center gap-3 text-amber-800 dark:text-amber-300">
          <ShieldAlert className="w-6 h-6 shrink-0 text-amber-600 dark:text-amber-400" />
          <h3 className="text-lg font-bold">1. Core Educational Safety Mandate (Bengaluru, India)</h3>
        </div>
        <p className="text-sm text-amber-900 dark:text-amber-200/90 leading-relaxed">
          MedSafe AI is strictly an <strong>educational research prototype</strong> developed for software architecture demonstration. <strong>It is NOT a certified medical device</strong> under the Drugs and Cosmetics Act of India and Karnataka State Health Regulations. It must never be used to diagnose, prescribe, adjust dosages, or alter treatment plans prescribed by registered medical practitioners (RMPs) in Bengaluru or across India.
        </p>
        <div className="p-4 bg-slate-100 dark:bg-slate-950/80 rounded-xl border border-amber-500/30 text-xs text-amber-900 dark:text-amber-300 font-mono">
          Mandatory Safety Statement: All unlisted drug combinations in the dataset return exact wording:
          <br />
          <span className="text-slate-900 dark:text-white italic block pt-1">
            "No known interaction was found in this prototype dataset. This does not confirm that the combination is safe."
          </span>
        </div>
      </div>

      {/* Indian & Bengaluru Emergency Medical Helplines */}
      <div className="glass-panel p-6 border-rose-500/40 bg-gradient-to-r from-rose-50/50 via-white to-white dark:from-rose-950/30 dark:via-slate-900 dark:to-slate-900 space-y-5">
        <div className="flex items-center gap-3 text-rose-800 dark:text-rose-300">
          <PhoneCall className="w-6 h-6 shrink-0 text-rose-600 dark:text-rose-400" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">2. Bengaluru & Indian Emergency Medical Phone Numbers</h3>
        </div>
        <p className="text-xs text-rose-900 dark:text-rose-200/90 leading-relaxed">
          If you or someone around you experiences severe drug reaction symptoms (blood in vomit, acute chest pain, anaphylaxis, severe dyspnea, sudden skin detachment, or loss of consciousness in Bengaluru), contact emergency medical services immediately.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-semibold">
          <div className="bg-slate-100 dark:bg-slate-950 p-3.5 rounded-xl border border-rose-500/40 text-center space-y-1">
            <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-mono">Namma 112 (Bengaluru ERSS)</span>
            <span className="text-rose-600 dark:text-rose-400 text-xl font-bold block">112</span>
            <span className="text-[10px] text-slate-600 dark:text-slate-300 block">Karnataka Emergency Helpline</span>
          </div>

          <div className="bg-slate-100 dark:bg-slate-950 p-3.5 rounded-xl border border-rose-500/40 text-center space-y-1">
            <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-mono">Arogya Kavacha Ambulance</span>
            <span className="text-rose-600 dark:text-rose-400 text-xl font-bold block">108 / 102</span>
            <span className="text-[10px] text-slate-600 dark:text-slate-300 block">Bengaluru Emergency Medical Response</span>
          </div>

          <div className="bg-slate-100 dark:bg-slate-950 p-3.5 rounded-xl border border-amber-500/40 text-center space-y-1">
            <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-mono">Victoria Hospital Poison Cell</span>
            <span className="text-amber-800 dark:text-amber-300 text-sm font-mono block">080-26701150</span>
            <span className="text-[10px] text-slate-600 dark:text-slate-300 block">Bengaluru Toxicology / 1056</span>
          </div>

          <div className="bg-slate-100 dark:bg-slate-950 p-3.5 rounded-xl border border-sky-500/40 text-center space-y-1">
            <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-mono">PvPI / Karnataka Helpline</span>
            <span className="text-sky-700 dark:text-sky-300 text-sm font-mono block">1800-180-3024</span>
            <span className="text-[10px] text-slate-600 dark:text-slate-300 block">Adverse Drug Reaction Reporting</span>
          </div>
        </div>
      </div>

      {/* Indian & Bengaluru Emergency Medical Centers */}
      <div className="glass-panel p-6 border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-3 text-sky-600 dark:text-sky-400">
          <Hospital className="w-6 h-6 shrink-0" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">3. Bengaluru Emergency Medical & Poison Control Centers</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              Victoria Hospital & BMCRI (Toxicology & Emergency Trauma)
            </h4>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
              Fort, Kalasipalya, near K.R. Market, Bengaluru, Karnataka - 560002. Apex Government Medical College Hospital & Primary Poison Control Unit in Bengaluru.
            </p>
            <div className="font-mono text-slate-500 dark:text-slate-400 text-[11px] space-y-0.5 pt-1">
              <div>Casualty & Poison Line: 080-26701150 / 080-26700433</div>
              <div>Karnataka Health Helpline: 1056 / 080-22183333</div>
            </div>
          </div>

          <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              NIMHANS (Emergency Neuro & Acute Medical Care)
            </h4>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
              Hosur Road, Lakkasandra, Wilson Garden, Bengaluru, Karnataka - 560029. Premier National Institute for Emergency Neuro-Toxicology & Mental Health Crises.
            </p>
            <div className="font-mono text-slate-500 dark:text-slate-400 text-[11px] space-y-0.5 pt-1">
              <div>24x7 Emergency Casualty: 080-26995000 / 080-26995555</div>
              <div>National Tele-MANAS / Crisis Line: 14416</div>
            </div>
          </div>

          <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              Sri Jayadeva Institute of Cardiovascular Sciences
            </h4>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
              Bannerghatta Main Road, Jayanagar 9th Block, Bengaluru, Karnataka - 560069. Premier Apex Cardiac Emergency & Acute Coronary Care Facility.
            </p>
            <div className="font-mono text-slate-500 dark:text-slate-400 text-[11px] space-y-0.5 pt-1">
              <div>Cardiac Emergency Desk: 080-22977400 / 080-22977500</div>
            </div>
          </div>

          <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              Major Bengaluru Emergency & Multi-Specialty Hospitals
            </h4>
            <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-1 text-[11px] leading-relaxed">
              <li><strong>Bowring & Lady Curzon Hospital (BMCRI)</strong>, Shivajinagar (Emergency: 080-25591325)</li>
              <li><strong>St. John's Medical College Hospital</strong>, Sarjapur Road (Emergency: 080-22065000)</li>
              <li><strong>Manipal Hospital</strong>, HAL Old Airport Rd / Yeshwanthpur (Emergency: 080-25024444)</li>
              <li><strong>Fortis Hospital</strong>, Bannerghatta Road (Emergency: 105711 / 080-66214444)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Deterministic Architecture vs LLM Role */}
      <div className="glass-panel p-6 border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-3 text-sky-600 dark:text-sky-400">
          <Cpu className="w-6 h-6 shrink-0" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">4. Deterministic Backend Engine vs Gemini LLM</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Deterministic Backend Engine (Rule Owner)
            </h4>
            <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-1 leading-relaxed">
              <li>Sorts active ingredient pairs alphabetically (<code className="text-sky-700 dark:text-sky-300">ingredient_a &lt; ingredient_b</code>).</li>
              <li>Queries curated database rules for severity (<span className="text-rose-600 dark:text-rose-400">high</span>, <span className="text-amber-600 dark:text-amber-400">moderate</span>, <span className="text-sky-600 dark:text-sky-400">low</span>, <span className="text-slate-500 dark:text-slate-400">unknown</span>).</li>
              <li>Dictates overall risk level. LLMs cannot override severity.</li>
            </ul>
          </div>

          <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              Gemini LLM (Explanation Translator)
            </h4>
            <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-1 leading-relaxed">
              <li>Receives ONLY normalized medicines, deterministic severity, and retrieved citations.</li>
              <li>Translates evidence into accessible plain language.</li>
              <li>Validated with Pydantic; rejected if it introduces unevidenced claims or overrides severity.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Data Provenance & Regulators */}
      <div className="glass-panel p-6 border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-3 text-teal-600 dark:text-teal-400">
          <BookOpen className="w-6 h-6 shrink-0" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">5. Indian & Bengaluru Regulatory Bodies & Data Provenance</h3>
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          MedSafe AI resolves Indian pharmaceutical brand names (Dolo 650, Brufen, Combiflam, Ecosprin, Manforce, Glycomet, Stamlo, Listril, Daxid, Ultracet) to active ingredients. Citations reference <strong>CDSCO</strong> (Central Drugs Standard Control Organization), <strong>IPC</strong> (Indian Pharmacopoeia Commission), <strong>PvPI</strong> safety bulletins, and the <strong>Drugs Control Department, Government of Karnataka</strong> (Palace Road, Bengaluru).
        </p>
        <div className="flex flex-wrap gap-3 text-xs">
          <a
            href="https://cdsco.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
          >
            CDSCO (Central Drugs Standard Control Organization) <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="https://ipc.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
          >
            IPC / PvPI Pharmacovigilance Programme <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="https://dcd.karnataka.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            Karnataka Drugs Control Dept (Bengaluru) <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Prototype Boundaries */}
      <div className="glass-panel p-6 border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-3 text-sky-600 dark:text-sky-400">
          <ShieldCheck className="w-6 h-6 shrink-0 text-emerald-500" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">6. Clinical AI Engine Coverage & Consumer Safety Boundaries</h3>
        </div>
        <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 font-bold">•</span>
            <span><strong>100% Confident Dynamic Assessment:</strong> Powered by Gemini 3.8 Flash, high-speed Flash-Lite, and open-source Gemma 4 reasoning, MedSafe AI dynamically evaluates arbitrary drug combinations into High, Moderate, or Low risk severity with optimized patient guidance, eliminating dataset dead-ends.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 dark:text-amber-400 font-bold">•</span>
            <span><strong>No Genetic / Patient Factor Modeling:</strong> Does not model renal function, hepatic impairment, age, or pharmacogenomic variations.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 dark:text-amber-400 font-bold">•</span>
            <span><strong>Pairwise Matrix Evaluation:</strong> Evaluates pairwise drug combinations ($N \times (N-1) / 2$). Complex 3+ drug synergistic cascades require expert pharmacologist assessment.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

