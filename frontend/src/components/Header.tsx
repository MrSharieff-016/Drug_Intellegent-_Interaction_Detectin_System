import React from 'react';
import { supabase } from '../services/supabase';
import { ShieldCheck, History, BookOpen, LogIn, LogOut, User, Sun, Moon, MessageSquare, Database } from 'lucide-react';

interface HeaderProps {
  activeTab: 'chat' | 'analyzer' | 'history' | 'limitations';
  setActiveTab: (tab: 'chat' | 'analyzer' | 'history' | 'limitations') => void;
  user: any;
  onOpenAuth: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onOpenKnowledgeBase?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  user,
  onOpenAuth,
  theme,
  toggleTheme,
  onOpenKnowledgeBase,
}) => {
  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#060a0f]/95 backdrop-blur-md border-b border-emerald-100 dark:border-emerald-950/40 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand Logo */}
        <div
          onClick={() => setActiveTab('chat')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-0.5 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-white dark:bg-[#060a0f] rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 heading-italic">
              MedSafe <span className="gradient-text not-italic font-sans font-bold">AI</span>
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans -mt-0.5">
              Intelligent Drug Interaction Detection System
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-1.5 bg-slate-100/90 dark:bg-[#090e17] p-1 rounded-xl border border-emerald-100 dark:border-emerald-950/60 text-xs font-medium">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'chat'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800/80'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> AI Chatbot
          </button>

          <button
            onClick={() => setActiveTab('analyzer')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'analyzer'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800/80'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Classic Analyzer
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800/80'
            }`}
          >
            <History className="w-3.5 h-3.5" /> History
          </button>

          <button
            onClick={() => setActiveTab('limitations')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'limitations'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800/80'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Limitations
          </button>
        </nav>

        {/* Knowledge Base Status Badge & Theme Changer */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {onOpenKnowledgeBase && (
            <button
              onClick={onOpenKnowledgeBase}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/40 text-xs font-medium transition"
              title="View 30 connected global open data feeds"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="hidden sm:inline">● Knowledge Base Online</span>
              <span className="sm:hidden">30 Feeds</span>
            </button>
          )}

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            type="button"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            className="p-2 rounded-xl bg-slate-100 dark:bg-[#0e1524] text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-800 transition-all hover:scale-105 flex items-center justify-center"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-emerald-600" />
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1 bg-slate-100 dark:bg-[#0e1524] border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-lg">
                <User className="w-3.5 h-3.5 text-emerald-500" />
                <span className="max-w-[100px] truncate">{user.email || 'User'}</span>
              </span>
              <button
                onClick={handleSignOut}
                title="Sign out"
                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-300/40 dark:border-emerald-700/40 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" /> Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
