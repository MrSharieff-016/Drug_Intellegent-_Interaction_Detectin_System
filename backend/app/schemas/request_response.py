"""
Pydantic Schemas for MedSafe AI API requests and responses.
"""

from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field


class MedicationInputItem(BaseModel):
    name: str = Field(..., description="Medicine name (brand or generic)")
    strength: Optional[str] = Field(None, description="e.g. 5 mg, 500 mg")
    route: Optional[str] = Field(None, description="e.g. oral, topical")


class AnalyzeRequest(BaseModel):
    medications: List[MedicationInputItem] = Field(
        ..., min_length=1, description="List of medications to evaluate for interactions"
    )


class NormalizedMedication(BaseModel):
    entered_name: str
    canonical_name: str
    rxcui: str
    synonyms: List[str] = Field(default_factory=list)


class EvidenceCitation(BaseModel):
    source_name: str
    source_url: str
    label_section: str
    excerpt: str


class PairResult(BaseModel):
    medicine_a: str
    medicine_b: str
    risk_level: Literal["high", "moderate", "low", "unknown"]
    title: str
    plain_explanation: str
    why_it_matters: str
    recommended_action: str
    urgent_warning: Optional[str] = None
    evidence: List[EvidenceCitation] = Field(default_factory=list)


class AmbiguousOrNotFoundMedicine(BaseModel):
    entered_name: str
    reason: str
    suggestions: List[str] = Field(default_factory=list)


class AnalyzeResponse(BaseModel):
    analysis_id: str
    overall_risk: Literal["high", "moderate", "low", "unknown"]
    disclaimer: str = "Educational prototype only; verify with a pharmacist or prescriber."
    normalized_medications: List[NormalizedMedication]
    pair_results: List[PairResult]
    not_found_or_ambiguous: List[AmbiguousOrNotFoundMedicine] = Field(default_factory=list)
    retrieval_confidence: float = Field(default=0.0, ge=0.0, le=1.0)


class SuggestionItem(BaseModel):
    name: str
    rxcui: Optional[str] = None
    type: str = "ingredient"  # 'brand' | 'generic' | 'ingredient'


class FeedbackRequest(BaseModel):
    analysis_id: str
    rating: Optional[int] = 1  # 1 for thumbs up, -1 for thumbs down
    comment: Optional[str] = None

    # Continuous Learning & Medication Resolution fields:
    unresolved_medication: Optional[str] = None
    canonical_name: Optional[str] = None
    medication_a: Optional[str] = None
    medication_b: Optional[str] = None
    suggested_risk: Optional[Literal["high", "moderate", "low"]] = None
    solution_action: Optional[str] = None


class FeedbackResponse(BaseModel):
    status: str = "success"
    message: str = "Feedback submitted successfully."
    learning_applied: bool = False
    learned_rule: Optional[Dict[str, Any]] = None


class AnalysisHistoryItem(BaseModel):
    id: str
    created_at: str
    overall_risk: str
    medications: List[str]
    pair_count: int
