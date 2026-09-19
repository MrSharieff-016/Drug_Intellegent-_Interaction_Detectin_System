import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Sparkles, Plus, Trash2, ShieldAlert, ShieldCheck, 
  Database, RefreshCw, ChevronRight, MessageSquare, AlertTriangle, 
  ExternalLink, PanelLeftClose, PanelLeft, Bot, User as UserIcon, CheckCircle2 
} from 'lucide-react';
import { analyzeInteractions, AnalysisResponse } from '../services/api';
import { PairResultCard } from '../components/PairResultCard';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  analysis?: AnalysisResponse;
  isLoading?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
}

interface ChatbotViewProps {
  onOpenKnowledgeBase: () => void;
  user: any;
}

const COMMON_DRUGS = [
  'Lithium',
  'Naproxen',
  'Aspirin',
  'Warfarin',
  'Paracetamol',
  'Ibuprofen',
  'Metformin',
  'Sildenafil',
  'Nitroglycerin',
  'Atorvastatin',
  'Clarithromycin',
  'Tramadol',
  'Sertraline',
  'Lisinopril',
  'Amlodipine',
];

const STARTER_PROMPTS = [
  {
    title: 'Lithium + Naproxen',
    prompt: 'Can I take Lithium with Naproxen? What are the risks of taking NSAIDs with bipolar medications?',
    meds: ['Lithium', 'Naproxen']
  },
  {
    title: 'Aspirin + Warfarin',
    prompt: 'Check bleeding hazard when combining Aspirin and Warfarin.',
    meds: ['Aspirin', 'Warfarin']
  },
  {
    title: 'Paracetamol + Ibuprofen',
    prompt: 'Is Paracetamol compatible with Ibuprofen for fever and body pain?',
    meds: ['Paracetamol', 'Ibuprofen']
  },
  {
    title: 'Metformin + Alcohol',
    prompt: 'What happens if you drink alcohol while on daily Metformin?',
    meds: ['Metformin', 'Alcohol']
  }
];

export const ChatbotView: React.FC<ChatbotViewProps> = ({ onOpenKnowledgeBase, user }) => {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('medsafe_chat_sessions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [{
      id: 'session-1',
      title: 'New Consultation',
      messages: [],
      createdAt: new Date().toISOString()
    }];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>('session-1');
  const [inputPrompt, setInputPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedMeds, setSelectedMeds] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('medsafe_chat_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, activeSessionId, isAnalyzing]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'New Consultation',
      messages: [],
      createdAt: new Date().toISOString()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setSelectedMeds([]);
  };

  const handleClearAllHistory = () => {
    if (window.confirm('Are you sure you want to clear all chat consultation history?')) {
      const freshSession: ChatSession = {
        id: `session-${Date.now()}`,
        title: 'New Consultation',
        messages: [],
        createdAt: new Date().toISOString()
      };
      setSessions([freshSession]);
      setActiveSessionId(freshSession.id);
      setSelectedMeds([]);
      localStorage.removeItem('medsafe_chat_sessions');
    }
  };

  // Helper to extract medication names from free text
  const extractMedications = (text: string): string[] => {
    const found: string[] = [];
    COMMON_DRUGS.forEach(drug => {
      const regex = new RegExp(`\\b${drug}\\b`, 'i');
      if (regex.test(text) && !found.includes(drug)) {
        found.push(drug);
      }
    });
    // Add selected chips if any
    selectedMeds.forEach(m => {
      if (!found.includes(m)) found.push(m);
    });
    return found;
  };

  const handleSendMessage = async (customPrompt?: string, customMeds?: string[]) => {
    const promptToSend = (customPrompt || inputPrompt).trim();
    if (!promptToSend && (!customMeds || customMeds.length < 2)) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update session title on first message
    const updatedTitle = activeSession.messages.length === 0
      ? (promptToSend.slice(0, 32) + (promptToSend.length > 32 ? '...' : ''))
      : activeSession.title;

    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          title: updatedTitle,
          messages: [...s.messages, userMessage]
        };
      }
      return s;
    }));

    setInputPrompt('');
    setIsAnalyzing(true);

    // Identify medications
    const medsToAnalyze = customMeds || extractMedications(promptToSend);

    try {
      if (medsToAnalyze.length < 2) {
        // Less than 2 medications detected
        const replyText = medsToAnalyze.length === 1
          ? `I noticed **${medsToAnalyze[0]}**, but pairwise interaction detection requires at least two medications. Please enter or select a second medication (e.g., *Naproxen*, *Aspirin*, or *Metformin*).`
          : "Please specify at least two medication names to evaluate interactions (e.g., 'Lithium and Naproxen' or 'Aspirin and Warfarin').";

        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setSessions(prev => prev.map(s => {
          if (s.id === activeSessionId) {
            return { ...s, messages: [...s.messages, assistantMsg] };
          }
          return s;
        }));
      } else {
        // Call backend analyzer (Tier 1-4 with 50k combination dataset & 30 feeds grounding)
        const medObjects = medsToAnalyze.map(m => ({ name: m }));
        const response = await analyzeInteractions(medObjects, user?.id);

        let summaryText = `Evaluated **${response.analysis_summary.total_pairs_evaluated} pairs** across **${response.analysis_summary.medications_count} medications**. `;
        if (response.overall_risk === 'high') {
          summaryText += `⚠️ **High Risk Interaction Detected**: Immediate clinical attention or dosage adjustment is required.`;
        } else if (response.overall_risk === 'moderate') {
          summaryText += `⚡ **Moderate Risk Interaction**: Concurrent use requires clinical monitoring and precaution.`;
        } else if (response.overall_risk === 'low') {
          summaryText += `✅ **Low Risk / Compatible**: Generally tolerated under therapeutic doses.`;
        } else {
          summaryText += `ℹ️ Analysis grounded via 30 open knowledge feeds and 50k dataset index.`;
        }

        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          text: summaryText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          analysis: response
        };

        setSessions(prev => prev.map(s => {
          if (s.id === activeSessionId) {
            return { ...s, messages: [...s.messages, assistantMsg] };
          }
          return s;
        }));
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: `⚠️ **Analysis Notice**: ${err.message || 'Unable to analyze interaction. Please check network connection.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, messages: [...s.messages, errorMsg] };
        }
        return s;
      }));
    } finally {
      setIsAnalyzing(false);
      setSelectedMeds([]);
    }
  };

  const toggleMedChip = (med: string) => {
    setSelectedMeds(prev => 
      prev.includes(med) ? prev.filter(m => m !== med) : [...prev, med]
    );
  };

  return (
    <div className="flex h-[calc(100vh-73px)] w-full overflow-hidden bg-[#f8fafc] dark:bg-[#060a0f] text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <aside 
        className={`${
          sidebarOpen ? 'w-72' : 'w-0'
        } transition-all duration-300 ease-in-out border-r border-emerald-100 dark:border-emerald-950/40 bg-white dark:bg-[#090e17] flex flex-col justify-between overflow-hidden z-20`}
      >
        <div className="p-4 flex flex-col h-full overflow-hidden">
          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md shadow-emerald-600/20 transition group"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              New Consultation
            </span>
            <span className="text-xs bg-emerald-700/60 px-2 py-0.5 rounded-md">Ctrl+K</span>
          </button>

          {/* Consultation History List */}
          <div className="mt-6 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Consultation History
              </span>
              <button
                onClick={handleClearAllHistory}
                title="Clear all consultations"
                className="text-slate-400 hover:text-rose-500 p-1 rounded transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              {sessions.map(s => (
                <div
                  key={s.id}
                  onClick={() => setActiveSessionId(s.id)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-sm transition group ${
                    activeSessionId === s.id
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-medium border border-emerald-200/80 dark:border-emerald-800/40'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <MessageSquare className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span className="truncate">{s.title}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-slate-400 transition" />
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Footer Info & Knowledge Base Trigger */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
            <button
              onClick={onOpenKnowledgeBase}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/40 transition"
            >
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                ● Knowledge Base Online
              </span>
              <span className="text-[10px] bg-emerald-200/60 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
                30 Feeds
              </span>
            </button>

            <div className="px-2 py-1 text-[11px] text-slate-400 text-center">
              MedSafe Engine v2.4 • Offline Index: 50,000 Pairs
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Interface */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Sub-header / Top Bar */}
        <div className="h-14 border-b border-emerald-100 dark:border-emerald-950/40 bg-white/80 dark:bg-[#060a0f]/80 backdrop-blur-md px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <h1 className="text-base font-bold text-slate-900 dark:text-white heading-italic">
                MedSafe Clinical Assistant
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Open Source & Clinical Grounded
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenKnowledgeBase}
              className="hidden md:flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition"
            >
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              <span>30 Open Data Feeds</span>
            </button>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeSession.messages.length === 0 ? (
            <div className="max-w-2xl mx-auto py-10 flex flex-col items-center text-center animate-fadeIn">
              {/* Emblem */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 p-0.5 shadow-xl shadow-emerald-500/20 mb-6 flex items-center justify-center">
                <div className="w-full h-full bg-white dark:bg-[#060a0f] rounded-[14px] flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-emerald-500" />
                </div>
              </div>

              <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-white heading-italic mb-3">
                Clinical Interaction & Medication Intelligence
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mb-8 leading-relaxed">
                Check any combination of popular or prescription medicines for severity, pharmacological mechanism, and safe management protocols.
              </p>

              {/* Starter Prompts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-8">
                {STARTER_PROMPTS.map((starter, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(starter.prompt, starter.meds)}
                    className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-950/60 bg-white dark:bg-[#090e17] hover:border-emerald-400 dark:hover:border-emerald-700 text-left transition-all hover:scale-[1.01] shadow-sm hover:shadow-md group"
                  >
                    <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1 group-hover:underline flex items-center justify-between">
                      <span>{starter.title}</span>
                      <Sparkles className="w-3.5 h-3.5 opacity-60" />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {starter.prompt}
                    </p>
                  </button>
                ))}
              </div>

              {/* Popular Medication Selection Chips */}
              <div className="w-full">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                  Quick Select Medications:
                </span>
                <div className="flex flex-wrap justify-center gap-2">
                  {COMMON_DRUGS.map((drug) => {
                    const isSelected = selectedMeds.includes(drug);
                    return (
                      <button
                        key={drug}
                        onClick={() => toggleMedChip(drug)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400'
                            : 'bg-white dark:bg-[#0e1524] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '} {drug}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {activeSession.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 sm:gap-4 ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.sender === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                      <Bot className="w-5 h-5" />
                    </div>
                  )}

                  <div className={`space-y-3 max-w-[85%] ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    <div
                      className={`inline-block p-4 rounded-2xl text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-emerald-600 text-white rounded-br-none shadow-md shadow-emerald-600/10'
                          : 'bg-white dark:bg-[#090e17] text-slate-800 dark:text-slate-100 border border-emerald-100 dark:border-emerald-950/60 rounded-bl-none shadow-sm'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                      <div className={`text-[10px] mt-1.5 ${msg.sender === 'user' ? 'text-emerald-200' : 'text-slate-400'}`}>
                        {msg.timestamp}
                      </div>
                    </div>

                    {/* Rich Clinical Pair Result Cards */}
                    {msg.analysis && msg.analysis.pair_results && (
                      <div className="space-y-4 mt-3">
                        {msg.analysis.pair_results.map((pair, idx) => (
                          <PairResultCard key={idx} result={pair} />
                        ))}
                      </div>
                    )}
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-1">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {isAnalyzing && (
                <div className="flex gap-3 items-center text-slate-400 text-xs">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="p-3 bg-white dark:bg-[#090e17] rounded-xl border border-emerald-100 dark:border-emerald-950/60 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                    <span>Cross-referencing 50,000 combinations & 30 open knowledge feeds...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Selected Medication Staging Chips */}
        {selectedMeds.length > 0 && (
          <div className="max-w-3xl mx-auto px-4 py-2 flex items-center gap-2 overflow-x-auto w-full">
            <span className="text-xs text-slate-400 whitespace-nowrap">Staged for analysis:</span>
            {selectedMeds.map(med => (
              <span
                key={med}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center gap-1 border border-emerald-300 dark:border-emerald-800"
              >
                {med}
                <button
                  onClick={() => toggleMedChip(med)}
                  className="hover:text-rose-500 ml-0.5"
                >
                  ×
                </button>
              </span>
            ))}
            <button
              onClick={() => handleSendMessage(`Analyze interaction between ${selectedMeds.join(' and ')}`, selectedMeds)}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline whitespace-nowrap ml-2"
            >
              Analyze Combination →
            </button>
          </div>
        )}

        {/* Bottom Input Dock */}
        <div className="p-4 border-t border-emerald-100 dark:border-emerald-950/40 bg-white/90 dark:bg-[#060a0f]/90 backdrop-blur-md">
          <div className="max-w-3xl mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Ask about medication combinations (e.g. 'Can I take Lithium with Naproxen?')..."
                disabled={isAnalyzing}
                className="w-full pl-4 pr-24 py-3 text-sm bg-slate-50 dark:bg-[#090e17] border border-emerald-200 dark:border-emerald-950/80 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-inner"
              />
              <button
                type="submit"
                disabled={isAnalyzing || (!inputPrompt.trim() && selectedMeds.length < 2)}
                className="absolute right-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-medium shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
              >
                {isAnalyzing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span className="text-xs hidden sm:inline">Ask AI</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
            <div className="mt-2 text-center text-[11px] text-slate-400">
              MedSafe AI is an educational clinical intelligence tool. Always consult a licensed healthcare professional for medical emergencies and prescribing decisions.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
