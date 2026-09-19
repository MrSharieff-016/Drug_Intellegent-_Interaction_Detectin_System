import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { KnowledgeBaseModal } from './components/KnowledgeBaseModal';
import { ChatbotView } from './pages/ChatbotView';
import { AnalyzerPage } from './pages/AnalyzerPage';
import { HistoryPage } from './pages/HistoryPage';
import { LimitationsPage } from './pages/LimitationsPage';
import { ShieldCheck } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'analyzer' | 'history' | 'limitations'>('chat');
  const [user, setUser] = useState<any>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);

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
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#060a0f] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white transition-colors duration-300">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenKnowledgeBase={() => setIsKnowledgeModalOpen(true)}
      />

      {/* Main Content Area */}
      {activeTab === 'chat' ? (
        <ChatbotView
          user={user}
          onOpenKnowledgeBase={() => setIsKnowledgeModalOpen(true)}
        />
      ) : (
        <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
          {activeTab === 'analyzer' && <AnalyzerPage user={user} />}
          {activeTab === 'history' && <HistoryPage user={user} />}
          {activeTab === 'limitations' && <LimitationsPage />}
        </main>
      )}

      {/* Knowledge Base Modal (30 Global Feeds) */}
      <KnowledgeBaseModal
        isOpen={isKnowledgeModalOpen}
        onClose={() => setIsKnowledgeModalOpen(false)}
      />

      {/* Supabase Auth Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* Footer (shown on non-chat tabs) */}
      {activeTab !== 'chat' && (
        <footer className="bg-white dark:bg-[#060a0f] border-t border-emerald-100 dark:border-emerald-950/40 py-6 text-xs text-slate-500 transition-colors duration-300">
          <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="font-semibold text-slate-800 dark:text-slate-300">MedSafe AI</span>
              <span>— Intelligent Clinical Drug Interaction Detection System</span>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <button
                onClick={() => setIsKnowledgeModalOpen(true)}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                30 Open Data Feeds
              </button>
              <span>•</span>
              <button
                onClick={() => setActiveTab('limitations')}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                Safety & Clinical Disclaimer
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
