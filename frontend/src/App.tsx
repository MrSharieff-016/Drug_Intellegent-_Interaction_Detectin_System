import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { AnalyzerPage } from './pages/AnalyzerPage';
import { HistoryPage } from './pages/HistoryPage';
import { LimitationsPage } from './pages/LimitationsPage';
import { ShieldCheck, Heart } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'analyzer' | 'history' | 'limitations'>('analyzer');
  const [user, setUser] = useState<any>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-sky-500 selection:text-white">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
        {activeTab === 'analyzer' && <AnalyzerPage user={user} />}
        {activeTab === 'history' && <HistoryPage user={user} />}
        {activeTab === 'limitations' && <LimitationsPage />}
      </main>

      {/* Supabase Auth Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-8 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span className="font-semibold text-slate-300">MedSafe AI</span>
            <span>— Educational Medication Interaction Risk Chatbot & RAG Prototype</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setActiveTab('limitations')}
              className="hover:text-slate-300 transition-colors"
            >
              Safety Disclaimer
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('limitations')}
              className="hover:text-slate-300 transition-colors"
            >
              RxNorm & DailyMed Data Sources
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
