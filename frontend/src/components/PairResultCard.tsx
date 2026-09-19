import React, { useState } from 'react';
import { PairResult } from '../types';
import { RiskBadge } from './RiskBadge';
import { EvidenceModal } from './EvidenceModal';
import {
  ChevronDown,
  ChevronUp,
  AlertOctagon,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  Info
} from 'lucide-react';

interface PairResultCardProps {
  pair: PairResult;
}

export const PairResultCard: React.FC<PairResultCardProps> = ({ pair }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showEvidence, setShowEvidence] = useState(false);

  const isHighRisk = pair.risk_level === 'high';
  const isUnknown = pair.risk_level === 'unknown';

  return (
    <div
      className={`glass-panel overflow-hidden transition-all border ${
        isHighRisk
          ? 'border-rose-500/40 bg-gradient-to-b from-rose-950/20 via-slate-900 to-slate-900'
          : pair.risk_level === 'moderate'
          ? 'border-amber-500/40 bg-gradient-to-b from-amber-950/20 via-slate-900 to-slate-900'
          : pair.risk_level === 'low'
          ? 'border-sky-500/30'
          : 'border-slate-800'
      }`}
    >
      {/* Pair Card Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-lg font-bold text-white capitalize">
            <span className="px-3 py-1 rounded-lg bg-slate-800 text-sky-300 border border-slate-700">
              {pair.medicine_a}
            </span>
            <span className="text-slate-500 font-mono text-sm">+</span>
            <span className="px-3 py-1 rounded-lg bg-slate-800 text-sky-300 border border-slate-700">
              {pair.medicine_b}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <RiskBadge level={pair.risk_level} size="md" />
          <button
            type="button"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 space-y-4 text-sm">
          {/* Interaction Title */}
          <div>
            <h4 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-400" />
              {pair.title}
            </h4>
          </div>

          {/* Plain Language Explanation */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Plain Language Summary
            </span>
            <p className="text-slate-200 leading-relaxed font-normal">
              {pair.plain_explanation}
            </p>
          </div>

          {/* Why it Matters */}
          {pair.why_it_matters && (
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Pharmacological Context / Why It Matters
              </span>
              <p className="text-slate-300 leading-relaxed text-xs">
                {pair.why_it_matters}
              </p>
            </div>
          )}

          {/* Recommended Action */}
          <div className="bg-sky-950/30 p-3.5 rounded-xl border border-sky-500/20 text-sky-200 flex items-start gap-3 text-xs">
            <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-sky-300 block mb-0.5">Recommended Next Steps:</span>
              <span>{pair.recommended_action}</span>
            </div>
          </div>

          {/* Urgent Warning (if emergency or high risk) */}
          {pair.urgent_warning && (
            <div className="bg-rose-950/50 p-4 rounded-xl border border-rose-500/40 text-rose-200 flex items-start gap-3 text-xs shadow-inner">
              <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-rose-300 block text-sm mb-1 uppercase tracking-wide">
                  ⚠️ Urgent Warning / Red-Flag Symptoms:
                </span>
                <span className="leading-relaxed font-medium">{pair.urgent_warning}</span>
              </div>
            </div>
          )}

          {/* Evidence Citations Trigger */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
            <span className="text-xs text-slate-400">
              Evidence Sources: {pair.evidence.length} cited label section(s)
            </span>
            <button
              type="button"
              onClick={() => setShowEvidence(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-medium transition-colors border border-slate-700"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
              View Cited FDA Evidence <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Evidence Modal */}
      <EvidenceModal
        isOpen={showEvidence}
        onClose={() => setShowEvidence(false)}
        medicineA={pair.medicine_a}
        medicineB={pair.medicine_b}
        citations={pair.evidence}
      />
    </div>
  );
};
