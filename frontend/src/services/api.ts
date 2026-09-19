import axios from 'axios';
import {
  AnalyzeResponse,
  SuggestionItem,
  FeedbackPayload,
  AnalysisHistoryItem,
  MedicationInputItem
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchSuggestions = async (query: string): Promise<SuggestionItem[]> => {
  if (!query.trim()) return [];
  try {
    const res = await api.get<SuggestionItem[]>('/api/medications/suggest', {
      params: { q: query },
    });
    return res.data;
  } catch (err) {
    console.error('Error fetching RxNorm suggestions:', err);
    return [];
  }
};

export const analyzeMedications = async (
  medications: MedicationInputItem[],
  userId?: string
): Promise<AnalyzeResponse> => {
  const headers: Record<string, string> = {};
  if (userId) {
    headers['X-User-ID'] = userId;
  }
  const res = await api.post<AnalyzeResponse>(
    '/api/analyze',
    { medications },
    { headers }
  );
  return res.data;
};

export const fetchAnalysisHistory = async (userId?: string): Promise<AnalysisHistoryItem[]> => {
  try {
    const headers: Record<string, string> = {};
    if (userId) {
      headers['X-User-ID'] = userId;
    }
    const res = await api.get<AnalysisHistoryItem[]>('/api/analyses', { headers });
    return res.data;
  } catch (err) {
    console.error('Error fetching analysis history:', err);
    return [];
  }
};

export const fetchAnalysisDetail = async (id: string): Promise<AnalyzeResponse> => {
  const res = await api.get<AnalyzeResponse>(`/api/analyses/${id}`);
  return res.data;
};

export const submitFeedback = async (
  payload: FeedbackPayload,
  userId?: string
): Promise<boolean> => {
  try {
    const headers: Record<string, string> = {};
    if (userId) {
      headers['X-User-ID'] = userId;
    }
    await api.post('/api/feedback', payload, { headers });
    return true;
  } catch (err) {
    console.error('Error submitting feedback:', err);
    return false;
  }
};
