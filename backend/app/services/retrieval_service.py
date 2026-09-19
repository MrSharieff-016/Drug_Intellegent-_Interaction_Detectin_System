"""
TF-IDF Retrieval Service using scikit-learn.

Builds TF-IDF vectorizer over medical label source chunks stored in Supabase / local memory.
Calculates cosine similarity to retrieve cited evidence snippets.
Retrieval MUST NEVER independently decide a risk level.
"""

import logging
from typing import List, Dict, Any, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.schemas.request_response import EvidenceCitation
from app.services.database_service import get_all_source_chunks

logger = logging.getLogger("medsafe.retrieval")

# In-memory retrieval state
_vectorizer: Optional[TfidfVectorizer] = None
_tfidf_matrix: Optional[np.ndarray] = None
_chunk_corpus: List[Dict[str, Any]] = []


def initialize_retrieval_engine():
    """
    Fits the TF-IDF vectorizer over all source chunks from the database/local store.
    Should be called at server startup or after label ingestion.
    """
    global _vectorizer, _tfidf_matrix, _chunk_corpus

    chunks = get_all_source_chunks()
    _chunk_corpus = chunks

    if not chunks:
        logger.warning("No source chunks found to fit TF-IDF vectorizer.")
        _vectorizer = None
        _tfidf_matrix = None
        return

    documents = []
    for chunk in chunks:
        # Build enriched indexable text combining ingredients, section name, and content
        ing_text = " ".join(chunk.get("ingredient_names", []))
        sec_text = chunk.get("section_name", "")
        content_text = chunk.get("content", "")
        doc = f"{ing_text} {sec_text} {content_text}"
        documents.append(doc)

    _vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        stop_words="english",
        lowercase=True,
        sublinear_tf=True
    )
    _tfidf_matrix = _vectorizer.fit_transform(documents)
    logger.info(f"TF-IDF retrieval engine initialized with {len(documents)} document chunks.")


def retrieve_evidence_for_pair(
    ingredient_a: str,
    ingredient_b: str,
    top_k: int = 3,
    min_threshold: float = 0.15
) -> Tuple[List[EvidenceCitation], float]:
    """
    Retrieves top_k evidence snippets for a pair of active ingredients using cosine similarity.
    Returns (citations_list, confidence_score).
    """
    if _vectorizer is None or _tfidf_matrix is None or not _chunk_corpus:
        # If vectorizer is not ready, return empty with 0.0 confidence
        return [], 0.0

    query_str = f"{ingredient_a} {ingredient_b} drug interactions warnings contraindications mechanism bleeding toxicity risk"
    query_vec = _vectorizer.transform([query_str])

    # Compute cosine similarity
    similarities = cosine_similarity(query_vec, _tfidf_matrix).flatten()

    # Get top matching indices
    top_indices = np.argsort(similarities)[::-1]

    retrieved: List[EvidenceCitation] = []
    scores: List[float] = []

    for idx in top_indices:
        score = float(similarities[idx])
        if score < min_threshold or len(retrieved) >= top_k:
            break

        chunk = _chunk_corpus[idx]
        src = chunk.get("sources") or {}
        
        excerpt_text = chunk.get("content", "")
        if len(excerpt_text) > 300:
            excerpt_text = excerpt_text[:300] + "..."

        citation = EvidenceCitation(
            source_name=src.get("source_name", "DailyMed / FDA Label"),
            source_url=src.get("source_url", "https://dailymed.nlm.nih.gov"),
            label_section=chunk.get("section_name", "Drug Interactions"),
            excerpt=excerpt_text
        )
        retrieved.append(citation)
        scores.append(score)

    confidence = float(np.mean(scores)) if scores else 0.0
    return retrieved, round(confidence, 2)
