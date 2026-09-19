import React, { useState, useEffect } from 'react';
import { AnalysisHistoryItem, AnalyzeResponse } from '../types';
import { fetchAnalysisHistory, fetchAnalysisDetail } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { PairResultCard } from '../components/PairResultCard';
import { History, Calendar, Pill, ArrowLeft, Loader2 } from 'lucide-react';

interface HistoryPageProps {
  user: any;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ user }) => {
  const [historyItems, setHistoryItems] = useState<AnalysisHistoryItem[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      const data = await fetchAnalysisHistory(user?.id);
      setHistoryItems(data);
      setLoading(false);
    };
    loadHistory();
  }, [user]);

  const handleSelectHistoryItem = async (id: string) => {
    setDetailLoading(true);
    try {
      const detail = await fetchAnalysisDetail(id);
      setSelectedDetail(detail);
    } catch (err) {
      console.error('Failed to load analysis detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  if (selectedDetail) {
    return (
      <div className="space-y-6 animate-fade-in pb-12">
        <button
          onClick={() => setSelectedDetail(null)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors border border-slate-300 dark:border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" /> Back to History List
        </button>

        <div className="glass-panel p-6 border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Analysis ID: {selectedDetail.analysis_id}</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mt-1">
              Historical Report: <RiskBadge level={selectedDetail.overall_risk} size="md" />
            </h3>
          </div>
        </div>

        <div className="space-y-4">
          {selectedDetail.pair_results.map((pair, idx) => (
            <PairResultCard key={idx} pair={pair} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="glass-panel p-6 border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <History className="w-6 h-6 text-sky-500 dark:text-sky-400" />
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Past Medication Analysis Audits</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Review saved medication combination queries and evaluated safety severity results.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-sky-500 dark:text-sky-400 animate-spin" />
          <span>Loading analysis records...</span>
        </div>
      ) : historyItems.length === 0 ? (
        <div className="glass-panel p-12 text-center text-slate-500 dark:text-slate-400 space-y-3 border-slate-200 dark:border-slate-800">
          <Pill className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
          <p className="text-sm">No past medication risk analysis records found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {historyItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSelectHistoryItem(item.id)}
              className="glass-panel p-5 border-slate-200 dark:border-slate-800 hover:border-sky-500/40 cursor-pointer transition-all flex flex-wrap items-center justify-between gap-4 group"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <RiskBadge level={item.overall_risk as any} size="sm" />
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Medications:</span>
                  {item.medications.map((med, mIdx) => (
                    <span
                      key={mIdx}
                      className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-sky-700 dark:text-sky-300 text-xs font-medium border border-slate-200 dark:border-slate-700 capitalize"
                    >
                      {med}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-sky-600 dark:text-sky-400 font-semibold group-hover:underline">
                  View Analysis →
                </span>
                <span className="block text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                  {item.pair_count} pair result(s)
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
