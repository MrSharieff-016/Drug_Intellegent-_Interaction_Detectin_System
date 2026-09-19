import React from 'react';
import { EvidenceCitation } from '../types';
import { X, ExternalLink, BookOpen, FileText } from 'lucide-react';

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicineA: string;
  medicineB: string;
  citations: EvidenceCitation[];
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  isOpen,
  onClose,
  medicineA,
  medicineB,
  citations,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-sky-400">
            <BookOpen className="w-5 h-5" />
            <h3 className="text-lg font-bold text-white capitalize">
              FDA Package Label Evidence Citations
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="py-4 overflow-y-auto space-y-4 flex-1">
          <p className="text-xs text-slate-400">
            Official package label excerpts and cited literature retrieved via TF-IDF vector matching for{' '}
            <strong className="text-sky-300 capitalize">{medicineA}</strong> and{' '}
            <strong className="text-sky-300 capitalize">{medicineB}</strong>.
          </p>

          {citations.length === 0 ? (
            <div className="p-6 text-center text-slate-400 bg-slate-950/50 rounded-xl border border-slate-800 text-sm">
              No specific external package insert snippets found in prototype corpus for this pair.
            </div>
          ) : (
            citations.map((cit, idx) => (
              <div
                key={idx}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 hover:border-slate-700 transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-sky-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    {cit.source_name}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] uppercase font-mono">
                    Section: {cit.label_section}
                  </span>
                </div>

                <p className="text-xs text-slate-300 italic leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  "{cit.excerpt}"
                </p>

                <div className="pt-1 flex justify-end">
                  <a
                    href={cit.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 hover:underline font-medium"
                  >
                    View Official Label on DailyMed <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
          >
            Close Citations
          </button>
        </div>
      </div>
    </div>
  );
};
