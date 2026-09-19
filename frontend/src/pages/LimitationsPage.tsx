import React from 'react';
import {
  ShieldAlert,
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
      <div className="glass-panel p-8 border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 text-center space-y-3">
        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold uppercase tracking-wider">
          Indian Healthcare & Clinical Safety Framework
        </span>
        <h2 className="text-3xl font-bold text-white tracking-tight">
          MedSafe AI: Limitations, Indian Standards & Emergency Protocol
        </h2>
        <p className="text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Comprehensive breakdown of educational prototype boundaries, deterministic decision architecture, Indian drug regulator sources (CDSCO / IPC / PvPI), and Indian emergency medical center contact protocols.
        </p>
      </div>

      {/* Core Safety Principle */}
      <div className="glass-panel p-6 border-amber-500/40 bg-gradient-to-b from-amber-950/30 to-slate-900 space-y-4">
        <div className="flex items-center gap-3 text-amber-300">
          <ShieldAlert className="w-6 h-6 shrink-0" />
          <h3 className="text-lg font-bold">1. Core Educational Safety Mandate (India)</h3>
        </div>
        <p className="text-sm text-amber-200/90 leading-relaxed">
          MedSafe AI is strictly an <strong>educational research prototype</strong> developed for software architecture demonstration. <strong>It is NOT a certified medical device</strong> under the Drugs and Cosmetics Act of India and must never be used to diagnose, prescribe, adjust dosages, or alter treatment plans prescribed by registered medical practitioners (RMP) in India.
        </p>
        <div className="p-4 bg-slate-950/80 rounded-xl border border-amber-500/30 text-xs text-amber-300 font-mono">
          Mandatory Safety Statement: All unlisted drug combinations in the dataset return exact wording:
          <br />
          <span className="text-white italic block pt-1">
            "No known interaction was found in this prototype dataset. This does not confirm that the combination is safe."
          </span>
        </div>
      </div>

      {/* Indian Emergency Medical Helplines */}
      <div className="glass-panel p-6 border-rose-500/40 bg-gradient-to-r from-rose-950/30 via-slate-900 to-slate-900 space-y-5">
        <div className="flex items-center gap-3 text-rose-300">
          <PhoneCall className="w-6 h-6 shrink-0" />
          <h3 className="text-lg font-bold text-white">2. Indian National Emergency Medical Numbers</h3>
        </div>
        <p className="text-xs text-rose-200/90 leading-relaxed">
          If you or someone around you experiences severe drug reaction symptoms, blood in vomit, chest pain, difficulty breathing, sudden severe skin rash, or loss of consciousness, contact Indian emergency medical services immediately.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-semibold">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-rose-500/40 text-center space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase font-mono">National Emergency</span>
            <span className="text-rose-400 text-xl font-bold block">112</span>
            <span className="text-[10px] text-slate-300 block">Single All-India Emergency Number</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-rose-500/40 text-center space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase font-mono">National Ambulance</span>
            <span className="text-rose-400 text-xl font-bold block">108 / 102</span>
            <span className="text-[10px] text-slate-300 block">Emergency Medical Response</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-amber-500/40 text-center space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase font-mono">AIIMS Poison Info</span>
            <span className="text-amber-300 text-sm font-mono block">1800-116-117</span>
            <span className="text-[10px] text-slate-300 block">NPIC New Delhi (Toll Free)</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-sky-500/40 text-center space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase font-mono">PvPI CDSCO Helpline</span>
            <span className="text-sky-300 text-sm font-mono block">1800-180-3024</span>
            <span className="text-[10px] text-slate-300 block">Adverse Drug Reaction Reporting</span>
          </div>
        </div>
      </div>

      {/* Indian Emergency Medical Centers */}
      <div className="glass-panel p-6 border-slate-800 space-y-4">
        <div className="flex items-center gap-3 text-sky-400">
          <Hospital className="w-6 h-6 shrink-0" />
          <h3 className="text-lg font-bold text-white">3. Indian Emergency Medical & Poison Control Centers</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-sky-300 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-sky-400" />
              National Poison Information Centre (NPIC)
            </h4>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Department of Pharmacology, All India Institute of Medical Sciences (AIIMS), Ansari Nagar, New Delhi - 110029.
            </p>
            <div className="font-mono text-slate-400 text-[11px] space-y-0.5 pt-1">
              <div>Toll-Free: 1800-116-117</div>
              <div>Direct: 011-26589391 / 011-26593677</div>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-sky-300 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-sky-400" />
              Apex Government Trauma & Emergency Hospitals
            </h4>
            <ul className="list-disc list-inside text-slate-300 space-y-1 text-[11px] leading-relaxed">
              <li>AIIMS Emergency Trauma Centre (All India Institutes across States)</li>
              <li>PGIMER Emergency Care Centre, Chandigarh</li>
              <li>JIPMER Emergency Department, Puducherry</li>
              <li>State Government General Hospitals & Medical Colleges</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Deterministic Architecture vs LLM Role */}
      <div className="glass-panel p-6 border-slate-800 space-y-4">
        <div className="flex items-center gap-3 text-sky-400">
          <Cpu className="w-6 h-6 shrink-0" />
          <h3 className="text-lg font-bold text-white">4. Deterministic Backend Engine vs Gemini LLM</h3>
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
              <li>Translates evidence into accessible plain language.</li>
              <li>Validated with Pydantic; rejected if it introduces unevidenced claims or overrides severity.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Data Provenance & Regulators */}
      <div className="glass-panel p-6 border-slate-800 space-y-4">
        <div className="flex items-center gap-3 text-teal-400">
          <BookOpen className="w-6 h-6 shrink-0" />
          <h3 className="text-lg font-bold text-white">5. Indian Regulatory Bodies & Data Provenance</h3>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          MedSafe AI resolves Indian pharmaceutical brand names (Dolo 650, Brufen, Combiflam, Ecosprin, Manforce, Glycomet, Stamlo, Listril, Daxid, Ultracet) to active ingredients. Citations reference <strong>CDSCO</strong> (Central Drugs Standard Control Organization), <strong>IPC</strong> (Indian Pharmacopoeia Commission), and <strong>PvPI</strong> safety bulletins.
        </p>
        <div className="flex flex-wrap gap-3 text-xs">
          <a
            href="https://cdsco.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-sky-400 hover:underline flex items-center gap-1"
          >
            CDSCO (Central Drugs Standard Control Organization) <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="https://ipc.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-sky-400 hover:underline flex items-center gap-1"
          >
            IPC / PvPI Pharmacovigilance Programme <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Prototype Boundaries */}
      <div className="glass-panel p-6 border-slate-800 space-y-4">
        <div className="flex items-center gap-3 text-amber-400">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <h3 className="text-lg font-bold text-white">6. Prototype Dataset Boundaries</h3>
        </div>
        <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-amber-400 font-bold">•</span>
            <span><strong>Curated Benchmark Dataset:</strong> The prototype dataset contains curated rules for core benchmark drug pairs (e.g. Warfarin + NSAIDs, Nitrates + Sildenafil, ACE Inhibitors + Potassium-sparing diuretics). Unlisted combinations return an explicit unknown result.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 font-bold">•</span>
            <span><strong>No Genetic / Patient Factor Modeling:</strong> Does not model renal function, hepatic impairment, age, or pharmacogenomic variations.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 font-bold">•</span>
            <span><strong>Pairwise Matrix Evaluation:</strong> Evaluates pairwise drug combinations ($N \times (N-1) / 2$). Complex 3+ drug synergistic cascades require expert pharmacologist assessment.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
