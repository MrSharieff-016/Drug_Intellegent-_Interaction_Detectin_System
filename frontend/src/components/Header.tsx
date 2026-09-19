import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { KnowledgeBaseModal } from './KnowledgeBaseModal';
import {
  ShieldCheck,
  MessageSquare,
  Sliders,
  History,
  BookOpen,
  LogIn,
  LogOut,
  User,
  Sun,
  Moon,
  Globe
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'chat' | 'analyzer' | 'history' | 'limitations';
  setActiveTab: (tab: 'chat' | 'analyzer' | 'history' | 'limitations') => void;
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
  const [isKBOpen, setIsKBOpen] = useState(false);

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#070b12]/95 backdrop-blur-md border-b border-emerald-100 dark:border-slate-800/90 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand Logo with Italic Heading */}
        <div
          onClick={() => setActiveTab('chat')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-sky-500 p-0.5 shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-white dark:bg-[#070b12] rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white heading-italic flex items-center gap-2">
              MedSafe <span className="text-emerald-600 dark:text-emerald-400 font-sans not-italic">AI</span>
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Clinical Medication Safety Chatbot & 50k Combination Library
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2 bg-emerald-50/70 dark:bg-slate-900/80 p-1 rounded-2xl border border-emerald-200/60 dark:border-slate-800 text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'chat'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-emerald-100/60 dark:hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>AI Chatbot</span>
          </button>

          <button
            onClick={() => setActiveTab('analyzer')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'analyzer'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-emerald-100/60 dark:hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Form Analyzer</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-emerald-100/60 dark:hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>History</span>
          </button>

          <button
            onClick={() => setActiveTab('limitations')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'limitations'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-emerald-100/60 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Safety & Sources</span>
          </button>
        </nav>

        {/* Knowledge Base Status & Theme Changer */}
        <div className="flex items-center gap-2.5">
          {/* Knowledge Base Online Badge */}
          <button
            onClick={() => setIsKBOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all"
            title="View 30 Global Knowledge Feeds"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Knowledge Base Online</span>
          </button>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            type="button"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-800 transition-all hover:scale-105 flex items-center justify-center"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-xl">
                <User className="w-3.5 h-3.5 text-emerald-500" />
                <span className="truncate max-w-[120px]">{user.email || 'User'}</span>
              </span>
              <button
                onClick={handleSignOut}
                className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-slate-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      <KnowledgeBaseModal isOpen={isKBOpen} onClose={() => setIsKBOpen(false)} />
    </header>
  );
};
