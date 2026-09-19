"""
Integration API tests for MedSafe AI endpoints (/health, /api/medications/suggest, /api/analyze, /api/feedback).
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.scripts.seed_demo_data import seed_all_demo_data
from app.services.retrieval_service import initialize_retrieval_engine

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_api_test_data():
    seed_all_demo_data()
    initialize_retrieval_engine()



def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["app"] == "MedSafe AI"


def test_suggest_medications_endpoint():
    response = client.get("/api/medications/suggest?q=warf")
    assert response.status_code == 200
    suggestions = response.json()
    assert isinstance(suggestions, list)
    assert len(suggestions) > 0


def test_analyze_medications_high_risk_pair():
    payload = {
        "medications": [
            {"name": "warfarin", "strength": "5 mg", "route": "oral"},
            {"name": "ibuprofen", "strength": "400 mg", "route": "oral"}
        ]
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["analysis_id"] is not None
    assert data["overall_risk"] == "high"
    assert len(data["pair_results"]) == 1
    pair = data["pair_results"][0]
    assert pair["risk_level"] == "high"
    assert "bleeding" in pair["title"].lower() or "bleeding" in pair["plain_explanation"].lower()
    assert len(pair["evidence"]) > 0


def test_analyze_unknown_pair():
    payload = {
        "medications": [
            {"name": "paracetamol", "strength": "500 mg", "route": "oral"},
            {"name": "unknown_medication_xyz", "strength": "10 mg", "route": "oral"}
        ]
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["overall_risk"] == "unknown"
    pair = data["pair_results"][0]
    assert pair["risk_level"] == "unknown"
    assert pair["plain_explanation"] == "No known interaction was found in this prototype dataset. This does not confirm that the combination is safe."


def test_analyze_aspirin_warfarin_and_reversed_order():
    # Test 1: Aspirin + Warfarin
    resp_1 = client.post("/api/analyze", json={
        "medications": [
            {"name": "Aspirin", "strength": "75 mg", "route": "Oral"},
            {"name": "Warfarin", "strength": "5 mg", "route": "Oral"}
        ]
    })
    assert resp_1.status_code == 200
    data_1 = resp_1.json()
    assert data_1["overall_risk"] == "high"
    assert len(data_1["pair_results"]) == 1
    assert data_1["pair_results"][0]["risk_level"] == "high"

    # Test 2: Warfarin + Aspirin (Reversed order)
    resp_2 = client.post("/api/analyze", json={
        "medications": [
            {"name": "Warfarin", "strength": "5 mg", "route": "Oral"},
            {"name": "Aspirin", "strength": "75 mg", "route": "Oral"}
        ]
    })
    assert resp_2.status_code == 200
    data_2 = resp_2.json()
    assert data_2["overall_risk"] == "high"
    assert data_1["pair_results"][0]["risk_level"] == data_2["pair_results"][0]["risk_level"]


def test_analyze_all_demo_pairs_via_api():
    # Sildenafil + Nitroglycerin
    resp = client.post("/api/analyze", json={
        "medications": [{"name": "Sildenafil"}, {"name": "Nitroglycerin"}]
    })
    assert resp.status_code == 200 and resp.json()["overall_risk"] == "high"

    # Lisinopril + Spironolactone
    resp = client.post("/api/analyze", json={
        "medications": [{"name": "Lisinopril"}, {"name": "Spironolactone"}]
    })
    assert resp.status_code == 200 and resp.json()["overall_risk"] == "high"

    # Aspirin + Paracetamol
    resp = client.post("/api/analyze", json={
        "medications": [{"name": "Aspirin"}, {"name": "Paracetamol"}]
    })
    assert resp.status_code == 200 and resp.json()["overall_risk"] == "low"


def test_analyze_multi_medications_three_drugs():
    payload = {
        "medications": [
            {"name": "Aspirin 75mg"},
            {"name": "Warfarin 5mg"},
            {"name": "Paracetamol 500mg"}
        ]
    }
    resp = client.post("/api/analyze", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    # 3 medications generate 3 unique pairs: (aspirin, warfarin), (acetaminophen, aspirin), (acetaminophen, warfarin)
    assert len(data["pair_results"]) == 3
    assert data["overall_risk"] == "high"


def test_feedback_submission():
    analyze_resp = client.post("/api/analyze", json={
        "medications": [
            {"name": "warfarin"},
            {"name": "ibuprofen"}
        ]
    })
    analysis_id = analyze_resp.json()["analysis_id"]

    feedback_payload = {
        "analysis_id": analysis_id,
        "rating": 1,
        "comment": "Very clear and helpful cited warning!"
    }
    fb_resp = client.post("/api/feedback", json=feedback_payload)
    assert fb_resp.status_code == 200
    assert fb_resp.json()["status"] == "success"

