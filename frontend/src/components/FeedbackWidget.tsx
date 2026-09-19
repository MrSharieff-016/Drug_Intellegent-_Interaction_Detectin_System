import React, { useState } from 'react';
import { submitFeedback } from '../services/api';
import { ThumbsUp, ThumbsDown, CheckCircle2, MessageSquare } from 'lucide-react';

interface FeedbackWidgetProps {
  analysisId: string;
}

export const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({ analysisId }) => {
  const [rating, setRating] = useState<1 | -1 | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;
    setIsSubmitting(true);
    const ok = await submitFeedback({
      analysis_id: analysisId,
      rating,
      comment,
    });
    setIsSubmitting(false);
    if (ok) {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="glass-panel p-4 text-center text-xs text-emerald-300 flex items-center justify-center gap-2 border-emerald-500/30 bg-emerald-950/20">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        <span>Thank you for helping improve MedSafe AI explanation clarity!</span>
      </div>
    );
  }

  return (
    <div className="glass-panel p-4 border-slate-800 bg-slate-900/60">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
            Was this risk analysis clear and helpful?
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRating(1)}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1 transition-all ${
                rating === 1
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" /> Helpful
            </button>

            <button
              type="button"
              onClick={() => setRating(-1)}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1 transition-all ${
                rating === -1
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <ThumbsDown className="w-3.5 h-3.5" /> Unclear / Needs Improvement
            </button>
          </div>
        </div>

        {rating !== null && (
          <div className="pt-2 flex items-center gap-2 animate-fade-in">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Optional comment or suggestions..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              Submit Feedback
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
