"""
Unit tests for canonical pair ordering, deterministic risk calculation, and exact unknown wording.
"""

import pytest
from app.schemas.request_response import NormalizedMedication, PairResult
from app.services.interaction_engine import (
    generate_canonical_pairs,
    evaluate_pair_interaction,
    calculate_overall_risk,
    EXACT_UNKNOWN_TEXT,
)
from app.scripts.seed_demo_data import seed_all_demo_data


@pytest.fixture(autouse=True)
def setup_seed():
    seed_all_demo_data()


def test_canonical_pair_alphabetical_ordering():
    med_b = NormalizedMedication(entered_name="Ibuprofen", canonical_name="ibuprofen", rxcui="5640")
    med_a = NormalizedMedication(entered_name="Warfarin", canonical_name="warfarin", rxcui="11289")

    pairs = generate_canonical_pairs([med_b, med_a])
    assert len(pairs) == 1
    p1, p2 = pairs[0]
    assert p1.canonical_name == "ibuprofen"
    assert p2.canonical_name == "warfarin"
    assert p1.canonical_name < p2.canonical_name


def test_high_risk_curated_pair_evaluation():
    med1 = NormalizedMedication(entered_name="Warfarin", canonical_name="warfarin", rxcui="11289")
    med2 = NormalizedMedication(entered_name="Ibuprofen", canonical_name="ibuprofen", rxcui="5640")

    result = evaluate_pair_interaction(med1, med2)
    assert result.risk_level == "high"
    assert "bleeding" in result.plain_explanation.lower() or "bleeding" in result.title.lower()
    assert result.urgent_warning is not None


def test_aspirin_warfarin_high_risk_evaluation():
    med1 = NormalizedMedication(entered_name="Aspirin", canonical_name="aspirin", rxcui="1191")
    med2 = NormalizedMedication(entered_name="Warfarin", canonical_name="warfarin", rxcui="11289")

    result = evaluate_pair_interaction(med1, med2)
    assert result.risk_level == "high"
    assert "bleeding" in result.plain_explanation.lower() or "hemorrhage" in result.plain_explanation.lower()
    assert result.urgent_warning is not None


def test_unknown_interaction_wording_exact_match():
    med1 = NormalizedMedication(entered_name="UnknownDrugA", canonical_name="unknowndruga", rxcui="000")
    med2 = NormalizedMedication(entered_name="UnknownDrugB", canonical_name="unknowndrugb", rxcui="000")

    result = evaluate_pair_interaction(med1, med2)
    assert result.risk_level == "unknown"
    assert result.plain_explanation == EXACT_UNKNOWN_TEXT
    assert "safe" not in result.plain_explanation.lower() or EXACT_UNKNOWN_TEXT in result.plain_explanation


def test_overall_risk_highest_severity_rule():
    p_high = PairResult(
        medicine_a="warfarin", medicine_b="ibuprofen", risk_level="high",
        title="Bleeding", plain_explanation="...", why_it_matters="...", recommended_action="..."
    )
    p_mod = PairResult(
        medicine_a="amlodipine", medicine_b="simvastatin", risk_level="moderate",
        title="Myopathy", plain_explanation="...", why_it_matters="...", recommended_action="..."
    )
    p_unk = PairResult(
        medicine_a="drugx", medicine_b="drugy", risk_level="unknown",
        title="Unknown", plain_explanation=EXACT_UNKNOWN_TEXT, why_it_matters="...", recommended_action="..."
    )

    assert calculate_overall_risk([p_high, p_mod, p_unk]) == "high"
    assert calculate_overall_risk([p_mod, p_unk]) == "moderate"
    assert calculate_overall_risk([p_unk]) == "unknown"
