import React, { useState, useEffect, useRef } from 'react';
import {
  AnalyzeResponse,
  AnalysisHistoryItem,
  MedicationInputItem,
  PairResult
} from '../types';
import {
  analyzeMedications,
  fetchAnalysisHistory,
  fetchAnalysisDetail,
  clearAnalysisHistory
} from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { PairResultCard } from '../components/PairResultCard';
import { KnowledgeBaseModal } from '../components/KnowledgeBaseModal';
import { FeedbackWidget } from '../components/FeedbackWidget';
import {
  Send,
  Plus,
  Trash2,
  Globe,
  Database,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  HelpCircle,
  Pill,
  Sun,
  Moon,
  ChevronRight,
  Menu,
  X,
  Loader2,
  CheckCircle2
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  analysis?: AnalyzeResponse;
  suggestedFollowUps?: string[];
}

interface ChatbotViewProps {
  user: any;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onOpenAuth?: () => void;
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

export const ChatbotView: React.FC<ChatbotViewProps> = ({
  user,
  theme,
  toggleTheme,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [historyItems, setHistoryItems] = useState<AnalysisHistoryItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isKBModalOpen, setIsKBModalOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load audit history
  useEffect(() => {
    loadHistory();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAnalyzing]);

  const loadHistory = async () => {
    try {
      const data = await fetchAnalysisHistory(user?.id);
      setHistoryItems(data);
    } catch (err) {
      console.error('Error loading history:', err);
    }
  };

  const handleClearHistory = async () => {
    setIsClearing(true);
    try {
      await clearAnalysisHistory(user?.id);
      setHistoryItems([]);
      setShowClearConfirm(false);
      setToastMsg('Consultation history cleared.');
      setTimeout(() => setToastMsg(''), 3500);
    } catch (err) {
      console.error('Failed to clear history:', err);
      setHistoryItems([]);
      setShowClearConfirm(false);
    } finally {
      setIsClearing(false);
    }
  };

  // Helper to extract medication names from natural language or explicit text
  const extractMedications = (text: string): string[] => {
    const clean = text.toLowerCase();
    const detected: string[] = [];

    // Search against known dictionary drugs
    for (const drug of COMMON_DRUGS) {
      const low = drug.toLowerCase();
      // Match whole word or drug name in text
      const regex = new RegExp(`\\b${low}\\b`, 'i');
      if (regex.test(clean)) {
        if (!detected.includes(drug)) {
          detected.push(drug);
        }
      }
    }

    // If nothing found by dictionary, try splitting commas or 'and' / '+'
    if (detected.length < 2) {
      const parts = text
        .split(/(?:,|\band\b|\+|\/|with)/gi)
        .map((p) => p.replace(/[?.,!]/g, '').trim())
        .filter((p) => p.length > 2 && !['can', 'take', 'what', 'are', 'the', 'check', 'risk', 'between', 'for', 'when'].includes(p.toLowerCase()));
      for (const p of parts) {
        if (!detected.includes(p)) {
          detected.push(p);
        }
      }
    }

    return detected;
  };

  const handleSendMessage = async (textToSend?: string, directMeds?: string[]) => {
    const rawText = textToSend || inputText;
    if (!rawText.trim() && (!directMeds || directMeds.length < 1)) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: rawText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsAnalyzing(true);

    const medsToAnalyze = directMeds || extractMedications(rawText);

    try {
      if (medsToAnalyze.length >= 2) {
        const payload: MedicationInputItem[] = medsToAnalyze.map((m) => ({
          name: m,
          route: 'oral',
        }));

        const res = await analyzeMedications(payload, user?.id);

        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `I evaluated the combination of **${medsToAnalyze.join(' + ')}** across the 30 global open knowledge registries and verified FDA/WHO pharmacological data. Here is the clinical interaction safety report:`,
          analysis: res,
          suggestedFollowUps: [
            `What are the safer alternatives for ${medsToAnalyze[0]}?`,
            `What should I ask my pharmacist about this combination?`,
            `How many hours apart should these medicines be taken?`
          ],
        };

        setMessages((prev) => [...prev, assistantMsg]);
        loadHistory();
      } else if (medsToAnalyze.length === 1) {
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `I noticed you mentioned **${medsToAnalyze[0]}**. To evaluate drug-drug interaction risks, please provide a second medication (e.g. *"${medsToAnalyze[0]} and Naproxen"* or select from the quick medicine pills below).`,
          suggestedFollowUps: [
            `Combine ${medsToAnalyze[0]} with Paracetamol`,
            `Combine ${medsToAnalyze[0]} with Ibuprofen`,
            `Combine ${medsToAnalyze[0]} with Aspirin`
          ]
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `Could you specify the names of the two or more medications you would like to evaluate? For example, ask *"Can I take Lithium with Naproxen?"* or click one of the starter prompts below.`,
          suggestedFollowUps: [
            'Lithium + Naproxen',
            'Aspirin + Warfarin',
            'Paracetamol + Ibuprofen'
          ]
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err: any) {
      console.error('Chat analysis failed:', err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `I encountered an error analyzing your request. Please ensure the backend server is reachable and try again.`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectHistoryItem = async (id: string) => {
    try {
      setIsAnalyzing(true);
      const detail = await fetchAnalysisDetail(id);
      const meds = detail.normalized_medications.map((m) => m.canonical_name).join(' + ');

      const assistantMsg: ChatMessage = {
        id: Date.now().toString(),
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Loaded historical consultation audit for **${meds}**:`,
        analysis: detail,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Failed to load history audit:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStartNewChat = () => {
    setMessages([]);
    setInputText('');
    inputRef.current?.focus();
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] w-full rounded-3xl overflow-hidden border border-emerald-200/80 dark:border-emerald-500/20 bg-white dark:bg-[#070b12] shadow-2xl animate-fade-in">
      {/* SIDEBAR */}
      <div
        className={`${
          isSidebarOpen ? 'w-80' : 'w-0 -translate-x-full'
        } transition-all duration-300 ease-in-out border-r border-emerald-100 dark:border-slate-800/90 bg-emerald-50/40 dark:bg-[#0a0f1c] flex flex-col justify-between overflow-hidden shrink-0`}
      >
        {/* Sidebar Header & New Consultation */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-slate-900 dark:text-white heading-italic">
                MedSafe Chat
              </span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-emerald-100/60 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={handleStartNewChat}
            className="w-full py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-900/10 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Consultation</span>
          </button>

          {/* Knowledge Base Online Indicator Pill */}
          <button
            onClick={() => setIsKBModalOpen(true)}
            className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-900/90 border border-emerald-200/90 dark:border-emerald-500/30 hover:border-emerald-400 text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Knowledge Base Online
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-emerald-500 transition-colors">
                View 30 Feeds →
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              PubMed • WHO • India OGD Grounded
            </p>
          </button>
        </div>

        {/* Saved History List */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
              Past Audits
            </span>
            {historyItems.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                title="Clear all saved consultations"
              >
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            )}
          </div>

          {historyItems.length === 0 ? (
            <div className="p-4 text-center text-[11px] text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No saved consultations yet.
            </div>
          ) : (
            <div className="space-y-1.5">
              {historyItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectHistoryItem(item.id)}
                  className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-400 dark:hover:border-emerald-500/50 cursor-pointer transition-all text-xs group"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <RiskBadge level={item.overall_risk as any} size="sm" showIcon={false} />
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate block group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    {item.medications.join(' + ') || 'Medication Consultation'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-emerald-100 dark:border-slate-800/90 space-y-2 bg-emerald-50/70 dark:bg-[#0a0f1c]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              50k Dataset Ready
            </span>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                  <span>Dark</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col justify-between bg-white dark:bg-[#070b12] overflow-hidden">
        {/* Top Navbar */}
        <div className="h-14 px-5 border-b border-emerald-100 dark:border-slate-800/90 flex items-center justify-between bg-white/90 dark:bg-[#070b12]/90 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 rounded-xl border border-emerald-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
                title="Open Sidebar"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white heading-italic flex items-center gap-2">
                MedSafe AI Clinical Safety Chatbot
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsKBModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40 hover:bg-emerald-100 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>30 Knowledge Feeds Online</span>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>
        </div>

        {/* Toast Notification Banner */}
        {toastMsg && (
          <div className="p-3 bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Message Stream Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.length === 0 ? (
            /* Welcome Hero & Starter Chips */
            <div className="h-full flex flex-col justify-center items-center max-w-2xl mx-auto text-center space-y-6 animate-fade-in py-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-sky-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white heading-italic">
                  MedSafe AI Clinical Chatbot
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
                  Evaluate drug-drug interaction severities (High, Moderate, Low risk) with physiological mechanisms, actionable timing guidelines, and evidence from 30 open knowledge bases.
                </p>
              </div>

              {/* Starter Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left pt-2">
                {STARTER_PROMPTS.map((starter, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(starter.prompt, starter.meds)}
                    className="p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-500/20 bg-emerald-50/30 hover:bg-emerald-50 dark:bg-slate-900/60 dark:hover:bg-slate-900 transition-all hover:border-emerald-400 dark:hover:border-emerald-400 group shadow-sm text-left"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300">
                        {starter.title}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {starter.prompt}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Active Message Stream */
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3.5 ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.sender === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-600/30 mt-1">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-2xl space-y-3 ${
                      msg.sender === 'user' ? 'chat-bubble-user p-4' : 'chat-bubble-assistant p-5 w-full'
                    }`}
                  >
                    <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.text}
                    </div>

                    {/* Render Interactive Clinical Pair Cards Inline */}
                    {msg.analysis && msg.analysis.pair_results.length > 0 && (
                      <div className="space-y-4 pt-2 border-t border-emerald-200/60 dark:border-slate-800">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 heading-italic">
                            Evaluated Clinical Interactions:
                          </span>
                          <RiskBadge level={msg.analysis.overall_risk} size="sm" />
                        </div>

                        {msg.analysis.pair_results.map((pair, pIdx) => (
                          <PairResultCard key={pIdx} pair={pair} />
                        ))}
                      </div>
                    )}

                    {/* Inline Feedback — only shown on real analysis results */}
                    {msg.analysis && msg.sender === 'assistant' && (
                      <div className="pt-3 border-t border-emerald-200/40 dark:border-slate-800/80">
                        <FeedbackWidget
                          analysisId={msg.analysis.analysis_id}
                          medications={msg.analysis.normalized_medications.map((m) => ({ name: m.canonical_name }))}
                        />
                      </div>
                    )}

                    {/* Suggested Follow-Ups */}
                    {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                      <div className="pt-3 border-t border-emerald-200/40 dark:border-slate-800/80 space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          Suggested Questions:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.suggestedFollowUps.map((fu, fIdx) => (
                            <button
                              key={fIdx}
                              onClick={() => handleSendMessage(fu)}
                              className="px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-400 text-slate-700 dark:text-slate-200 transition-colors"
                            >
                              {fu}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 text-right font-mono">
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              ))}

              {isAnalyzing && (
                <div className="flex gap-3.5 justify-start">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-md">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="chat-bubble-assistant p-4 rounded-2xl flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Loading...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* BOTTOM INPUT SECTION */}
        <div className="p-4 sm:p-5 border-t border-emerald-100 dark:border-slate-800/90 bg-slate-50/50 dark:bg-[#0a0f1c]/80 space-y-3 shrink-0">
          {/* Quick Pill Drug Selector Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-4xl mx-auto scrollbar-none">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0 flex items-center gap-1 mr-1">
              <Pill className="w-3 h-3 text-emerald-500" /> Quick Add:
            </span>
            {COMMON_DRUGS.slice(0, 8).map((drug) => (
              <button
                key={drug}
                type="button"
                onClick={() => {
                  setInputText((prev) => (prev ? `${prev} + ${drug}` : drug));
                  inputRef.current?.focus();
                }}
                className="px-2.5 py-0.5 rounded-full text-xs bg-white dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 hover:border-emerald-400 text-slate-700 dark:text-slate-200 font-medium shrink-0 transition-colors"
              >
                + {drug}
              </button>
            ))}
          </div>

          {/* Text Input Box */}
          <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-slate-800 rounded-2xl p-2 shadow-lg shadow-emerald-950/5 focus-within:ring-2 focus-within:ring-emerald-500/40 focus-within:border-emerald-400">
            <textarea
              ref={inputRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything or enter medications (e.g. 'Can I take Lithium with Naproxen?')..."
              className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm px-3 py-1.5 focus:outline-none resize-none max-h-32"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isAnalyzing}
              className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white transition-all shrink-0 active:scale-95 shadow-md shadow-emerald-900/20"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="max-w-4xl mx-auto flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-mono px-2">
            <span>● Grounded in 30 Open Knowledge Bases (PubMed, WHO, India OGD, FDA)</span>
            <span className="hidden sm:inline">Press Enter to send, Shift+Enter for new line</span>
          </div>
        </div>
      </div>

      {/* Clear History Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/10">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white heading-italic">
                Clear Consultation History?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              This will permanently remove all past consultation audit records.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                disabled={isClearing}
                className="px-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleClearHistory}
                disabled={isClearing}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors"
              >
                {isClearing ? 'Clearing...' : 'Yes, Clear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Knowledge Base Explorer Modal */}
      <KnowledgeBaseModal
        isOpen={isKBModalOpen}
        onClose={() => setIsKBModalOpen(false)}
      />
    </div>
  );
};
