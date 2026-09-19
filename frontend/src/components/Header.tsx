import React from 'react';
import { supabase } from '../services/supabase';
import { ShieldCheck, History, BookOpen, LogIn, LogOut, User, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  activeTab: 'analyzer' | 'history' | 'limitations';
  setActiveTab: (tab: 'analyzer' | 'history' | 'limitations') => void;
  user: any;
  onOpenAuth: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  user,
  onOpenAuth,
  theme,
  toggleTheme,
}) => {
  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          onClick={() => setActiveTab('analyzer')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-teal-400 p-0.5 shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-sky-500 dark:text-sky-400" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              MedSafe <span className="gradient-text">AI</span>
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Educational Drug Risk Engine & Cited FDA Label RAG
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1.5 sm:gap-3 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('analyzer')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'analyzer'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Risk Analyzer
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" /> History
          </button>

          <button
            onClick={() => setActiveTab('limitations')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'limitations'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Limitations & Safety
          </button>
        </nav>

        {/* Theme Changer & Auth status button */}
        <div className="flex items-center gap-3">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            type="button"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 border border-slate-200 dark:border-slate-800 transition-all hover:scale-105 flex items-center justify-center"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-sky-600" />
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-lg">
                <User className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                {user.email || 'Authenticated User'}
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-sky-600 dark:text-sky-300 text-xs font-semibold border border-sky-500/30 transition-all hover:border-sky-500/60"
            >
              <LogIn className="w-3.5 h-3.5" /> Sign In / Supabase Auth
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

