import React, { useState } from 'react';
import { X, ExternalLink, Database, Search, CheckCircle, Globe2, Activity } from 'lucide-react';
import { GLOBAL_KNOWLEDGE_FEEDS, KnowledgeFeed } from '../services/knowledgeData';

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', 'Space & Climate', 'Global Health', 'Cybersecurity', 'Open Government Data', 'Academic & Research', 'Culture & Tech'];

  const filteredFeeds = GLOBAL_KNOWLEDGE_FEEDS.filter(feed => {
    const matchesSearch = 
      feed.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feed.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feed.coverage.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || feed.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-white dark:bg-[#090e17] border border-emerald-100 dark:border-emerald-950/50 rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-emerald-100 dark:border-emerald-950/50 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 via-white to-teal-50/30 dark:from-[#060a0f] dark:to-[#090e17]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white heading-italic">
                  Global Knowledge Base & Open Feeds
                </h2>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/40">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  30/30 Feeds Online
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time open datasets, public health surveillance, biomedical preprints, and government indexes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search datasets, epidemiology, preprints, CVEs, or open APIs..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-[#060a0f] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Feed List Grid */}
        <div className="p-6 overflow-y-auto max-h-[60vh] grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFeeds.map((feed: KnowledgeFeed) => (
            <div
              key={feed.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1424]/60 hover:border-emerald-300 dark:hover:border-emerald-700/50 hover:shadow-md transition group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                      {feed.name}
                    </h3>
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {feed.category}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                  {feed.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-emerald-500" />
                  Sync: {feed.updateFrequency}
                </span>

                <a
                  href={feed.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium group/link"
                >
                  Explore Feed <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>
          ))}

          {filteredFeeds.length === 0 && (
            <div className="col-span-2 py-12 text-center text-slate-400">
              <Globe2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No knowledge feeds matched your query.</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                className="text-xs text-emerald-600 dark:text-emerald-400 underline mt-1"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-[#060a0f] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>Grounding index active for all 30 knowledge sources</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
