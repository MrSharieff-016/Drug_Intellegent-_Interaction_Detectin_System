import React, { useState } from 'react';
import { MedicationInput as MedicationType, AnalyzeResponse } from '../types';
import { analyzeMedications } from '../services/api';
import { MedicationInput } from '../components/MedicationInput';
import { SafetyDisclaimer } from '../components/SafetyDisclaimer';
import { RiskBadge } from '../components/RiskBadge';
import { PairResultCard } from '../components/PairResultCard';
import { FeedbackWidget } from '../components/FeedbackWidget';
import {
  ShieldAlert,
  RotateCcw,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  Database,
  FileCheck
} from 'lucide-react';

interface AnalyzerPageProps {
  user: any;
}

export const AnalyzerPage: React.FC<AnalyzerPageProps> = ({ user }) => {
  const [medications, setMedications] = useState<MedicationType[]>([
    { id: '1', name: 'Warfarin', strength: '5 mg', route: 'oral' },
    { id: '2', name: 'Ibuprofen', strength: '400 mg', route: 'oral' },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAnalyze = async () => {
    setErrorMsg('');
    const validMeds = medications.filter((m) => m.name.trim().length > 0);
    if (validMeds.length < 1) {
      setErrorMsg('Please enter at least one medication name.');
      return;
    }

    setIsLoading(true);
    try {
      const payload = validMeds.map((m) => ({
        name: m.name,
        strength: m.strength,
        route: m.route,
      }));

      const res = await analyzeMedications(payload, user?.id);
      setResult(res);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setErrorMsg(
        err.response?.data?.detail ||
          'Failed to complete risk analysis. Ensure backend API is running.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setErrorMsg('');
    setMedications([
      { id: '1', name: '', strength: '', route: 'oral' },
      { id: '2', name: '', strength: '', route: 'oral' },
    ]);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Prominent Medical Safety Disclaimer Banner */}
      <SafetyDisclaimer />

      {/* Input Section */}
      <MedicationInput
        medications={medications}
        onChange={setMedications}
        onAnalyze={handleAnalyze}
        isLoading={isLoading}
      />

      {errorMsg && (
        <div className="p-4 bg-rose-950/60 border border-rose-500/40 rounded-2xl text-rose-200 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg('')}
            className="text-xs text-rose-400 underline hover:text-rose-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Results View */}
      {result && (
        <div className="space-y-6 pt-4 border-t border-slate-800">
          {/* Top Overall Result Banner */}
          <div className="glass-panel p-6 border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 shadow-2xl flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4" /> Comprehensive Analysis Report
              </span>
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                Overall Interaction Severity:
                <RiskBadge level={result.overall_risk} size="lg" />
              </h3>
              <p className="text-xs text-slate-300 italic max-w-xl">
                "{result.disclaimer}"
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 font-mono">
                <Database className="w-3.5 h-3.5 text-teal-400" />
                TF-IDF Retrieval Confidence: {(result.retrieval_confidence * 100).toFixed(0)}%
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Start New Analysis
              </button>
            </div>
          </div>

          {/* Normalized Ingredients Section */}
          <div className="glass-panel p-5 border-slate-800 space-y-3">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              RxNorm Normalized Active Ingredients:
            </h4>
            <div className="flex flex-wrap gap-2">
              {result.normalized_medications.map((norm, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2"
                >
                  <span className="text-slate-400">Entered:</span>
                  <span className="font-medium text-slate-200">{norm.entered_name}</span>
                  <span className="text-slate-500">→</span>
                  <span className="font-bold text-sky-300 capitalize">{norm.canonical_name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    (RxCUI: {norm.rxcui})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Unresolved/Ambiguous alert if any */}
          {result.not_found_or_ambiguous && result.not_found_or_ambiguous.length > 0 && (
            <div className="glass-panel p-5 border-amber-500/30 bg-amber-950/20 text-xs text-amber-200 space-y-2">
              <h4 className="font-bold text-amber-300 flex items-center gap-2 text-sm">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                Unresolved or Ambiguous Medications:
              </h4>
              <ul className="list-disc list-inside space-y-1">
                {result.not_found_or_ambiguous.map((amb, idx) => (
                  <li key={idx}>
                    <strong className="text-amber-300">{amb.entered_name}:</strong> {amb.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pairwise Interaction Results List */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-400" />
              Pairwise Drug Interaction Evaluations ({result.pair_results.length} pair(s))
            </h3>

            {result.pair_results.length === 0 ? (
              <div className="glass-panel p-8 text-center text-slate-400 text-sm">
                Single medication entered. At least two medications are required to evaluate pairwise interactions.
              </div>
            ) : (
              result.pair_results.map((pair, idx) => (
                <PairResultCard key={idx} pair={pair} />
              ))
            )}
          </div>

          {/* Feedback Widget */}
          <FeedbackWidget analysisId={result.analysis_id} />
        </div>
      )}
    </div>
  );
};
