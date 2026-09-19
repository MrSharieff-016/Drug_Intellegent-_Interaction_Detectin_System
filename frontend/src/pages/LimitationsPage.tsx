import React from 'react';
import {
  ShieldAlert,
  Cpu,
  BookOpen,
  PhoneCall,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ExternalLink
} from 'lucide-react';

export const LimitationsPage: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in pb-16 max-w-4xl mx-auto">
      {/* Title Header */}
      <div className="glass-panel p-8 border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 text-center space-y-3">
        <span className="px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs font-semibold uppercase tracking-wider">
          Indian Medical Standards & Presentation Safety Boundaries
        </span>
        <h2 className="text-3xl font-bold text-white tracking-tight">
          MedSafe AI: Limitations, Indian Architecture & Safety Standards
        </h2>
        <p className="text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Detailed explanation of safety principles, deterministic risk decision boundaries, Indian drug regulator provenance (CDSCO / IPC / PvPI), and emergency medical standards.
        </p>
      </div>

      {/* Core Principle Card */}
      <div className="glass-panel p-6 border-amber-500/40 bg-gradient-to-b from-amber-950/30 to-slate-900 space-y-4">
        <div className="flex items-center gap-3 text-amber-300">
          <ShieldAlert className="w-6 h-6 shrink-0" />
          <h3 className="text-lg font-bold">1. Core Educational Safety Principle</h3>
        </div>
        <p className="text-sm text-amber-200/90 leading-relaxed">
          MedSafe AI is an <strong>educational research prototype</strong> developed exclusively for demonstration and software architecture evaluation. <strong>It is NOT a medical device</strong> and must never be used to diagnose, prescribe, adjust dosages, or advise starting/stopping any drug therapy in India.
        </p>
        <div className="p-4 bg-slate-950/80 rounded-xl border border-amber-500/30 text-xs text-amber-300 font-mono">
          Strict Safety Mandate: All unknown medication combinations return exact wording:
          <br />
          <span className="text-white italic block pt-1">
            "No known interaction was found in this prototype dataset. This does not confirm that the combination is safe."
          </span>
        </div>
      </div>

      {/* Architecture Design */}
      <div className="glass-panel p-6 border-slate-800 space-y-4">
        <div className="flex items-center gap-3 text-sky-400">
          <Cpu className="w-6 h-6 shrink-0" />
          <h3 className="text-lg font-bold text-white">2. Deterministic Risk Engine vs LLM Role</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-sky-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Deterministic Backend Engine (Rule Owner)
            </h4>
            <ul className="list-disc list-inside text-slate-300 space-y-1 leading-relaxed">
              <li>Sorts active ingredient pairs alphabetically (<code className="text-sky-300">ingredient_a &lt; ingredient_b</code>).</li>
              <li>Queries curated database rules for severity (<span className="text-rose-400">high</span>, <span className="text-amber-400">moderate</span>, <span className="text-sky-400">low</span>, <span className="text-slate-400">unknown</span>).</li>
              <li>Dictates overall risk level. LLMs cannot override severity.</li>
            </ul>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-sky-300 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-sky-400" />
              Gemini LLM (Explanation Translator)
            </h4>
            <ul className="list-disc list-inside text-slate-300 space-y-1 leading-relaxed">
              <li>Receives ONLY normalized medicines, deterministic severity, and retrieved citations.</li>
              <li>Translates evidence into accessible 8th-grade language.</li>
              <li>Validated with Pydantic; rejected if it introduces unevidenced claims or overrides severity.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Indian Emergency & Medical Helplines */}
      <div className="glass-panel p-6 border-rose-500/40 bg-gradient-to-r from-rose-950/30 via-slate-900 to-slate-900 space-y-4">
        <div className="flex items-center gap-3 text-rose-300">
          <PhoneCall className="w-6 h-6 shrink-0" />
          <h3 className="text-lg font-bold">3. Indian Emergency & Medical Helplines</h3>
        </div>
        <p className="text-xs text-rose-200/90 leading-relaxed">
          If you or someone around you experiences severe adverse symptoms, breathing difficulty, uncontrollable bleeding, or loss of consciousness, contact Indian emergency services immediately.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-semibold">
          <div className="bg-slate-950 p-3 rounded-xl border border-rose-500/30 text-center space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase">National Emergency (India)</span>
            <span className="text-rose-400 text-lg block">Call 112 / 108</span>
            <span className="text-[10px] text-slate-400 block">Ambulance & Emergency Services</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/30 text-center space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase">AIIMS Poison Info Centre</span>
            <span className="text-amber-300 text-sm font-mono block">1800-116-117</span>
            <span className="text-[10px] text-slate-400 block">NPIC New Delhi (Toll Free)</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-sky-500/30 text-center space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase">PvPI Helpline (CDSCO)</span>
            <span className="text-sky-300 text-sm font-mono block">1800-180-3024</span>
            <span className="text-[10px] text-slate-400 block">Pharmacovigilance India</span>
          </div>
        </div>
      </div>

      {/* Data Provenance & Indian Drug Regulators */}
      <div className="glass-panel p-6 border-slate-800 space-y-4">
        <div className="flex items-center gap-3 text-teal-400">
          <BookOpen className="w-6 h-6 shrink-0" />
          <h3 className="text-lg font-bold text-white">4. Data Provenance & Indian Regulators</h3>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          MedSafe AI normalizes Indian brand names (such as Dolo 650, Brufen, Combiflam, Manforce, Ecosprin, Stamlo, Glycomet, Listril) to active pharmaceutical ingredients using NIH RxNorm and Indian pharmacopoeia catalogs. Citations reference <strong>CDSCO</strong> (Central Drugs Standard Control Organization), <strong>IPC</strong> (Indian Pharmacopoeia Commission), and <strong>PvPI</strong> safety alerts.
        </p>
        <div className="flex flex-wrap gap-3 text-xs">
          <a
            href="https://cdsco.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-sky-400 hover:underline flex items-center gap-1"
          >
            CDSCO (Ministry of Health India) <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="https://ipc.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-sky-400 hover:underline flex items-center gap-1"
          >
            IPC / PvPI Pharmacovigilance <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Prototype Limitations Checklist */}
      <div className="glass-panel p-6 border-slate-800 space-y-4">
        <div className="flex items-center gap-3 text-amber-400">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <h3 className="text-lg font-bold text-white">5. Known Prototype Dataset Boundaries</h3>
        </div>
        <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-amber-400 font-bold">•</span>
            <span><strong>Curated Seed Coverage:</strong> The prototype dataset contains clinically curated rules for core benchmark drug pairs (e.g. Warfarin + NSAIDs, Nitrates + Sildenafil, ACE Inhibitors + Potassium-sparing diuretics). Unlisted pairs return an explicit unknown status.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 font-bold">•</span>
            <span><strong>No Genetic / Patient Factor Modeling:</strong> Does not evaluate individual renal clearance, hepatic function, age, or pharmacogenomic variations.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 font-bold">•</span>
            <span><strong>Multi-Drug Matrix:</strong> Evaluates pairwise drug combinations ($N \times (N-1) / 2$). Complex 3+ drug synergistic cascades require clinical pharmacologist assessment.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
