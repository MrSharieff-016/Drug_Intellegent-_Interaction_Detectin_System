"""
Unit tests for TF-IDF retrieval service and evidence citations.
"""

import pytest
from app.scripts.seed_demo_data import seed_all_demo_data
from app.services.retrieval_service import initialize_retrieval_engine, retrieve_evidence_for_pair


@pytest.fixture(autouse=True)
def setup_tfidf():
    seed_all_demo_data()
    initialize_retrieval_engine()


def test_tfidf_evidence_retrieval_success():
    citations, confidence = retrieve_evidence_for_pair("warfarin", "ibuprofen", top_k=3)
    assert len(citations) > 0
    assert confidence > 0.0
    first = citations[0]
    assert first.source_url is not None
    assert "bleeding" in first.excerpt.lower() or "warfarin" in first.excerpt.lower()


def test_tfidf_unrelated_pair_returns_low_confidence():
    citations, confidence = retrieve_evidence_for_pair("xyzfake123", "abcunknown999", min_threshold=0.25)
    assert confidence < 0.1 or len(citations) == 0
