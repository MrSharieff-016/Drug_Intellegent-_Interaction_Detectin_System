export type RiskLevel = 'high' | 'moderate' | 'low' | 'unknown';

export interface MedicationInput {
  id: string;
  name: string;
  strength?: string;
  route?: string;
}

export type MedicationInputItem = Omit<MedicationInput, 'id'>;

export interface NormalizedMedication {
  entered_name: string;
  canonical_name: string;
  rxcui: string;
  synonyms: string[];
}

export interface EvidenceCitation {
  source_name: string;
  source_url: string;
  label_section: string;
  excerpt: string;
}

export interface PairResult {
  medicine_a: string;
  medicine_b: string;
  risk_level: RiskLevel;
  title: string;
  plain_explanation: string;
  why_it_matters: string;
  recommended_action: string;
  urgent_warning?: string;
  evidence: EvidenceCitation[];
}

export interface AmbiguousOrNotFoundMedicine {
  entered_name: string;
  reason: string;
  suggestions: string[];
}

export interface AnalyzeResponse {
  analysis_id: string;
  overall_risk: RiskLevel;
  disclaimer: string;
  normalized_medications: NormalizedMedication[];
  pair_results: PairResult[];
  not_found_or_ambiguous: AmbiguousOrNotFoundMedicine[];
  retrieval_confidence: number;
}

export interface SuggestionItem {
  name: string;
  rxcui?: string;
  type: string;
}

export interface FeedbackPayload {
  analysis_id: string;
  rating: 1 | -1;
  comment?: string;
}

export interface AnalysisHistoryItem {
  id: string;
  created_at: string;
  overall_risk: RiskLevel;
  medications: string[];
  pair_count: number;
}
