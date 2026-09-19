import React, { useState, useEffect, useRef } from 'react';
import { MedicationInput as MedicationType, SuggestionItem } from '../types';
import { fetchSuggestions } from '../services/api';
import { Plus, Trash2, Pill, Search, Sparkles, AlertTriangle } from 'lucide-react';

interface MedicationInputProps {
  medications: MedicationType[];
  onChange: (meds: MedicationType[]) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

export const MedicationInput: React.FC<MedicationInputProps> = ({
  medications,
  onChange,
  onAnalyze,
  isLoading,
}) => {
  const [activeInputId, setActiveInputId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveInputId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTextChange = async (id: string, name: string) => {
    const updated = medications.map((m) => (m.id === id ? { ...m, name } : m));
    onChange(updated);
    setActiveInputId(id);

    if (name.trim().length >= 2) {
      setIsSearching(true);
      const res = await fetchSuggestions(name);
      setSuggestions(res);
      setIsSearching(false);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (id: string, sug: SuggestionItem) => {
    const updated = medications.map((m) =>
      m.id === id ? { ...m, name: sug.name } : m
    );
    onChange(updated);
    setActiveInputId(null);
    setSuggestions([]);
  };

  const handleDetailChange = (id: string, field: 'strength' | 'route', val: string) => {
    const updated = medications.map((m) => (m.id === id ? { ...m, [field]: val } : m));
    onChange(updated);
  };

  const addMedicationRow = () => {
    const newId = Date.now().toString();
    onChange([...medications, { id: newId, name: '', strength: '', route: 'oral' }]);
    setActiveInputId(newId);
  };

  const removeMedicationRow = (id: string) => {
    if (medications.length <= 1) return;
    onChange(medications.filter((m) => m.id !== id));
  };

  const loadPresetDemo = (pairName: string) => {
    if (pairName === 'aspirin_warfarin') {
      onChange([
        { id: '1', name: 'Aspirin', strength: '75 mg', route: 'oral' },
        { id: '2', name: 'Warfarin', strength: '5 mg', route: 'oral' },
      ]);
    } else if (pairName === 'warfarin_ibuprofen') {
      onChange([
        { id: '1', name: 'Warfarin', strength: '5 mg', route: 'oral' },
        { id: '2', name: 'Ibuprofen', strength: '400 mg', route: 'oral' },
      ]);
    } else if (pairName === 'viagra_nitroglycerin') {
      onChange([
        { id: '1', name: 'Sildenafil', strength: '50 mg', route: 'oral' },
        { id: '2', name: 'Nitroglycerin', strength: '0.4 mg', route: 'sublingual' },
      ]);
    } else if (pairName === 'lisinopril_spironolactone') {
      onChange([
        { id: '1', name: 'Lisinopril', strength: '10 mg', route: 'oral' },
        { id: '2', name: 'Spironolactone', strength: '25 mg', route: 'oral' },
      ]);
    } else if (pairName === 'aspirin_paracetamol') {
      onChange([
        { id: '1', name: 'Aspirin', strength: '81 mg', route: 'oral' },
        { id: '2', name: 'Paracetamol', strength: '500 mg', route: 'oral' },
      ]);
    }
  };

  // Check for duplicates
  const names = medications.map((m) => m.name.trim().toLowerCase()).filter(Boolean);
  const hasDuplicates = new Set(names).size !== names.length;

  return (
    <div className="glass-panel p-6 shadow-2xl relative border-slate-200 dark:border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Pill className="w-5 h-5 text-sky-500 dark:text-sky-400" />
            Enter Medications to Analyze
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Add brand or generic medicine names. Autocomplete uses NIH RxNorm database.
          </p>
        </div>

        {/* Demo Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> Demo Pairs:
          </span>
          <button
            type="button"
            onClick={() => loadPresetDemo('aspirin_warfarin')}
            className="text-xs px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 transition-colors font-semibold"
          >
            Aspirin + Warfarin
          </button>
          <button
            type="button"
            onClick={() => loadPresetDemo('warfarin_ibuprofen')}
            className="text-xs px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 transition-colors"
          >
            Warfarin + Ibuprofen
          </button>
          <button
            type="button"
            onClick={() => loadPresetDemo('viagra_nitroglycerin')}
            className="text-xs px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 transition-colors"
          >
            Sildenafil + Nitroglycerin
          </button>
          <button
            type="button"
            onClick={() => loadPresetDemo('lisinopril_spironolactone')}
            className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 transition-colors"
          >
            Lisinopril + Spironolactone
          </button>
          <button
            type="button"
            onClick={() => loadPresetDemo('aspirin_paracetamol')}
            className="text-xs px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 transition-colors"
          >
            Aspirin + Paracetamol
          </button>
        </div>
      </div>

      {hasDuplicates && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/30 rounded-lg flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 dark:text-amber-400" />
          <span>Duplicate medication entries detected. Duplicate ingredients will be combined during analysis.</span>
        </div>
      )}

      {/* Medication Inputs List */}
      <div className="space-y-4 mb-6">
        {medications.map((med, idx) => (
          <div
            key={med.id}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all relative"
          >
            <div className="flex-1 relative" ref={activeInputId === med.id ? dropdownRef : null}>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Medication Name #{idx + 1}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={med.name}
                  onChange={(e) => handleTextChange(med.id, e.target.value)}
                  onFocus={() => setActiveInputId(med.id)}
                  placeholder="e.g. Warfarin, Advil, Lisinopril..."
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 pr-9"
                />
                <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3 top-2.5" />
              </div>

              {/* RxNorm Autocomplete Dropdown */}
              {activeInputId === med.id && (suggestions.length > 0 || isSearching) && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {isSearching ? (
                    <div className="p-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                      Searching NIH RxNorm catalog...
                    </div>
                  ) : (
                    suggestions.map((sug, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => handleSelectSuggestion(med.id, sug)}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-sky-50 dark:hover:bg-sky-600/20 flex items-center justify-between text-xs transition-colors"
                      >
                        <span className="font-medium text-slate-800 dark:text-slate-200">{sug.name}</span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {sug.type}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="w-full sm:w-32">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Strength (optional)
              </label>
              <input
                type="text"
                value={med.strength || ''}
                onChange={(e) => handleDetailChange(med.id, 'strength', e.target.value)}
                placeholder="e.g. 5 mg"
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="w-full sm:w-32">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Route
              </label>
              <select
                value={med.route || 'oral'}
                onChange={(e) => handleDetailChange(med.id, 'route', e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="oral">Oral</option>
                <option value="topical">Topical</option>
                <option value="sublingual">Sublingual</option>
                <option value="injection">Injection</option>
                <option value="inhalation">Inhalation</option>
              </select>
            </div>

            {medications.length > 1 && (
              <div className="self-end sm:self-center pt-2 sm:pt-4">
                <button
                  type="button"
                  onClick={() => removeMedicationRow(med.id)}
                  title="Remove medication"
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={addMedicationRow}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors border border-slate-300 dark:border-slate-700"
        >
          <Plus className="w-4 h-4" /> Add Another Medication
        </button>

        <button
          type="button"
          onClick={onAnalyze}
          disabled={isLoading || medications.filter((m) => m.name.trim()).length < 1}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-400 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Evaluating Risk Engine & Cited Evidence...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Analyze Combination Safety
            </>
          )}
        </button>
      </div>
    </div>
  );
};
