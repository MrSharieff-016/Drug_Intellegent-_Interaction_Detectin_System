import React, { useState } from 'react';
import { submitFeedback } from '../services/api';
import { ThumbsUp, ThumbsDown, CheckCircle2, MessageSquare, Sparkles, Sliders } from 'lucide-react';

interface FeedbackWidgetProps {
  analysisId: string;
  medications?: Array<{ name: string; strength?: string; route?: string }>;
  onFeedbackApplied?: () => void;
}

export const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({
  analysisId,
  medications,
  onFeedbackApplied,
}) => {
  const [rating, setRating] = useState<1 | -1 | null>(null);
  const [comment, setComment] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [suggestedRisk, setSuggestedRisk] = useState<'high' | 'moderate' | 'low' | ''>('');
  const [solutionAction, setSolutionAction] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating && !suggestedRisk) return;
    setIsSubmitting(true);

    const medA = medications && medications.length > 0 ? medications[0].name : undefined;
    const medB = medications && medications.length > 1 ? medications[1].name : undefined;

    const res = await submitFeedback({
      analysis_id: analysisId,
      rating: rating || 1,
      comment,
      medication_a: medA,
      medication_b: medB,
      suggested_risk: suggestedRisk ? suggestedRisk : undefined,
      solution_action: solutionAction ? solutionAction : undefined,
    });
    setIsSubmitting(false);
    if (res.success) {
      setFeedbackMessage(res.message || 'Thank you for your feedback! The system has been updated.');
      setSubmitted(true);
      if (suggestedRisk && onFeedbackApplied) {
        setTimeout(() => {
          onFeedbackApplied();
        }, 800);
      }
    }
  };

  if (submitted) {
    return (
      <div className="glass-panel p-4 text-center text-xs text-emerald-300 flex flex-col items-center justify-center gap-1.5 border-emerald-500/30 bg-emerald-950/20 animate-fade-in">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold">{feedbackMessage}</span>
        </div>
        <p className="text-[11px] text-emerald-400/80">
          Future queries for this medication combination will immediately utilize these updated severity rules and solutions.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-5 border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 shadow-lg space-y-3">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-sky-500" />
            Was this risk analysis accurate and clear?
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRating(1)}
              className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-all font-medium ${
                rating === 1
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/50 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" /> Accurate
            </button>

            <button
              type="button"
              onClick={() => {
                setRating(-1);
                setShowAdvanced(true);
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-all font-medium ${
                rating === -1
                  ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/50 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ThumbsDown className="w-3.5 h-3.5" /> Needs Correction
            </button>

            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="px-2.5 py-1.5 text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-medium"
            >
              <Sliders className="w-3.5 h-3.5" />
              {showAdvanced ? 'Hide Options' : 'Suggest Severity'}
            </button>
          </div>
        </div>

        {/* Expandable Clinical Rule Suggestion / Feedback Fields */}
        {showAdvanced && (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Teach MedSafe: Update Severity for this Medication Combination
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Suggested Risk Classification:
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSuggestedRisk('high')}
                  className={`text-xs px-3 py-1 rounded-lg border font-semibold transition-all ${
                    suggestedRisk === 'high'
                      ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50'
                  }`}
                >
                  High Risk (Dangerous)
                </button>
                <button
                  type="button"
                  onClick={() => setSuggestedRisk('moderate')}
                  className={`text-xs px-3 py-1 rounded-lg border font-semibold transition-all ${
                    suggestedRisk === 'moderate'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/50'
                  }`}
                >
                  Moderate Risk (Caution)
                </button>
                <button
                  type="button"
                  onClick={() => setSuggestedRisk('low')}
                  className={`text-xs px-3 py-1 rounded-lg border font-semibold transition-all ${
                    suggestedRisk === 'low'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50'
                  }`}
                >
                  Low Risk (Safe / Compatible)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Optimized Solution & Clinical Guidance for Consumers:
              </label>
              <input
                type="text"
                value={solutionAction}
                onChange={(e) => setSolutionAction(e.target.value)}
                placeholder="e.g. Separate doses by 2 to 4 hours, take with food, monitor blood pressure..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>
        )}

        {(rating !== null || showAdvanced) && (
          <div className="pt-2 flex items-center gap-2 animate-fade-in">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Comments, scientific explanation, or notes for future queries..."
              className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSubmitting ? 'Updating...' : 'Submit & Update Knowledge'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
