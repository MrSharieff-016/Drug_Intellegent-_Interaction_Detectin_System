import axios from 'axios';
import {
  AnalyzeResponse,
  SuggestionItem,
  FeedbackPayload,
  AnalysisHistoryItem,
  MedicationInputItem
} from '../types';

let rawApiUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
if (rawApiUrl && !rawApiUrl.startsWith('http://') && !rawApiUrl.startsWith('https://')) {
  rawApiUrl = `https://${rawApiUrl}`;
}
if (rawApiUrl.endsWith('/')) {
  rawApiUrl = rawApiUrl.slice(0, -1);
}
const API_BASE_URL = rawApiUrl;

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

const getAuthHeaders = (userId?: string): Record<string, string> => {
  const headers: Record<string, string> = {};
  if (userId && typeof userId === 'string') {
    const clean = userId.trim();
    if (clean && clean !== 'undefined' && clean !== 'null') {
      headers['X-User-ID'] = clean;
    }
  }
  return headers;
};

export const fetchAnalysisHistory = async (userId?: string): Promise<AnalysisHistoryItem[]> => {
  try {
    const res = await api.get<AnalysisHistoryItem[]>('/api/analyses', {
      headers: getAuthHeaders(userId),
    });
    return res.data;
  } catch (err) {
    console.error('Error fetching analysis history:', err);
    return [];
  }
};

export const clearAnalysisHistory = async (userId?: string): Promise<boolean> => {
  try {
    await api.delete('/api/analyses', {
      headers: getAuthHeaders(userId),
    });
    return true;
  } catch (err) {
    console.error('Error clearing analysis history:', err);
    return false;
  }
};

export const fetchAnalysisDetail = async (id: string): Promise<AnalyzeResponse> => {
  const res = await api.get<AnalyzeResponse>(`/api/analyses/${id}`);
  return res.data;
};

export interface FeedbackResult {
  success: boolean;
  message?: string;
}

export const submitFeedback = async (
  payload: FeedbackPayload,
  userId?: string
): Promise<FeedbackResult> => {
  try {
    const headers: Record<string, string> = {};
    if (userId) {
      headers['X-User-ID'] = userId;
    }
    const res = await api.post<{ status: string; message: string }>('/api/feedback', payload, { headers });
    return { success: true, message: res.data.message };
  } catch (err: any) {
    console.error('Error submitting feedback:', err);
    return { success: false, message: err?.response?.data?.detail || 'Failed to record feedback.' };
  }
};
