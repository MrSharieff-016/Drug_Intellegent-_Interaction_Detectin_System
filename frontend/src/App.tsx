import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { ChatbotView } from './pages/ChatbotView';
import { AnalyzerPage } from './pages/AnalyzerPage';
import { HistoryPage } from './pages/HistoryPage';
import { LimitationsPage } from './pages/LimitationsPage';
import { ShieldCheck } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'analyzer' | 'history' | 'limitations'>('chat');
  const [user, setUser] = useState<any>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Light / Dark Theme State Management
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('medsafe_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('medsafe_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    if (!supabase) return;

    // Get current user session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white transition-colors duration-300">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-6 flex-1 w-full flex flex-col">
        {activeTab === 'chat' && (
          <ChatbotView
            user={user}
            theme={theme}
            toggleTheme={toggleTheme}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}
        {activeTab === 'analyzer' && <AnalyzerPage user={user} />}
        {activeTab === 'history' && <HistoryPage user={user} />}
        {activeTab === 'limitations' && <LimitationsPage />}
      </main>

      {/* Supabase Auth Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* Footer */}
      <footer className="bg-white/80 dark:bg-[#070b12]/80 border-t border-emerald-100 dark:border-slate-800 py-6 text-xs text-slate-500 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold text-slate-800 dark:text-slate-300 heading-italic">MedSafe AI</span>
            <span>— Clinical Safety Chatbot grounded in 30 Open Knowledge Bases & 50k Combination Library</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setActiveTab('limitations')}
              className="hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              Safety Disclaimer
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('limitations')}
              className="hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              RxNorm, WHO & DailyMed Data
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
