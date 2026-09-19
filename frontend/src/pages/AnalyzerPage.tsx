import React, { useState } from 'react';
import { MedicationInput as MedicationType, AnalyzeResponse, AmbiguousOrNotFoundMedicine } from '../types';
import { analyzeMedications, submitFeedback } from '../services/api';
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

interface UnresolvedMedicineCardProps {
  amb: AmbiguousOrNotFoundMedicine;
  analysisId: string;
  otherMeds: MedicationType[];
  onResolved: () => void;
}

const UnresolvedMedicineCard: React.FC<UnresolvedMedicineCardProps> = ({
  amb,
  analysisId,
  otherMeds,
  onResolved,
}) => {
  const [canonicalName, setCanonicalName] = useState(
    amb.suggestions && amb.suggestions.length > 0 ? amb.suggestions[0].replace(/ generic| 5mg/gi, '') : ''
  );
  const [selectedRisk, setSelectedRisk] = useState<'high' | 'moderate' | 'low'>('low');
  const [solutionAction, setSolutionAction] = useState('Take with food. Monitor for individual tolerance.');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleTeachAndResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canonicalName.trim()) return;

    setIsSubmitting(true);
    const otherMedName = otherMeds.length > 0 ? otherMeds[0].name : '';
    const res = await submitFeedback({
      analysis_id: analysisId,
      unresolved_medication: amb.entered_name,
      canonical_name: canonicalName.trim(),
      medication_a: amb.entered_name,
      medication_b: otherMedName,
      suggested_risk: selectedRisk,
      solution_action: solutionAction,
      comment: notes || `${amb.entered_name} resolved to ${canonicalName}.`,
    });
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg(res.message || 'Learned successfully! Re-analyzing with updated knowledge...');
      setTimeout(() => {
        onResolved();
      }, 700);
    }
  };

  if (successMsg) {
    return (
      <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-200 flex items-center gap-2 text-xs font-semibold animate-fade-in">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>{successMsg}</span>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleTeachAndResolve}
      className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 dark:text-white text-xs">
            Medicine: <span className="text-sky-600 dark:text-sky-400 font-mono">{amb.entered_name}</span>
          </span>
          <span className="text-[10px] text-slate-500 font-medium">({amb.reason})</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Active Ingredient / Canonical Generic:
          </label>
          <input
            type="text"
            required
            value={canonicalName}
            onChange={(e) => setCanonicalName(e.target.value)}
            placeholder="e.g. Paracetamol, Metformin, Amoxicillin..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Assign Interaction Risk Severity:
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedRisk('high')}
              className={`flex-1 text-[11px] py-1.5 px-2 rounded-lg border font-semibold transition-all ${
                selectedRisk === 'high'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                  : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900'
              }`}
            >
              High Risk
            </button>
            <button
              type="button"
              onClick={() => setSelectedRisk('moderate')}
              className={`flex-1 text-[11px] py-1.5 px-2 rounded-lg border font-semibold transition-all ${
                selectedRisk === 'moderate'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900'
              }`}
            >
              Moderate
            </button>
            <button
              type="button"
              onClick={() => setSelectedRisk('low')}
              className={`flex-1 text-[11px] py-1.5 px-2 rounded-lg border font-semibold transition-all ${
                selectedRisk === 'low'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
              }`}
            >
              Low / Safe
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Consumer Guidance / Solution:
        </label>
        <input
          type="text"
          value={solutionAction}
          onChange={(e) => setSolutionAction(e.target.value)}
          placeholder="e.g. Take with food, space doses by 2 hours, monitor blood glucose..."
          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="submit"
          disabled={isSubmitting || !canonicalName.trim()}
          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {isSubmitting ? 'Learning & Updating...' : 'Teach MedSafe & Resolve'}
        </button>
      </div>
    </form>
  );
};

interface AnalyzerPageProps {
  user: any;
}

export const AnalyzerPage: React.FC<AnalyzerPageProps> = ({ user }) => {
  const [medications, setMedications] = useState<MedicationType[]>([
    { id: '1', name: '', strength: '', route: 'oral' },
    { id: '2', name: '', strength: '', route: 'oral' },
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

          {/* Unresolved / Ambiguous alert with interactive learning feedback */}
          {result.not_found_or_ambiguous && result.not_found_or_ambiguous.length > 0 && (
            <div className="space-y-4">
              <div className="glass-panel p-5 border-amber-300 dark:border-amber-500/40 bg-amber-50/70 dark:bg-amber-950/30 text-xs text-amber-900 dark:text-amber-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2 text-sm">
                    <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    Unresolved Medication Detected
                  </h4>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-bold tracking-wide">
                    Continuous Learning Mode
                  </span>
                </div>
                <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                  The medicine below was not found in the standard dictionary. You can teach MedSafe right now to map it and categorize its interaction severity (High, Moderate, or Low risk) so that future searches immediately return accurate solutions!
                </p>

                <div className="space-y-3">
                  {result.not_found_or_ambiguous.map((amb, idx) => (
                    <UnresolvedMedicineCard
                      key={idx}
                      amb={amb}
                      analysisId={result.analysis_id}
                      otherMeds={medications.filter((m) => m.name.trim().toLowerCase() !== amb.entered_name.toLowerCase())}
                      onResolved={handleAnalyze}
                    />
                  ))}
                </div>
              </div>
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
          <FeedbackWidget
            analysisId={result.analysis_id}
            medications={medications}
            onFeedbackApplied={handleAnalyze}
          />
        </div>
      )}
    </div>
  );
};
