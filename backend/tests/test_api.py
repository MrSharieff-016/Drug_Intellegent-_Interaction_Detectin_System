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


def test_dynamic_feedback_learning_loop():
    # 1. Search an unknown unresolved medication combination
    unresolved_name = "ZenithCureTest"
    partner_name = "Ibuprofen"
    
    first_resp = client.post("/api/analyze", json={
        "medications": [{"name": unresolved_name}, {"name": partner_name}]
    })
    assert first_resp.status_code == 200
    first_data = first_resp.json()
    unresolved_names = [u["entered_name"].lower() for u in first_data.get("not_found_or_ambiguous", [])]
    assert unresolved_name.lower() in unresolved_names
    
    # 2. Submit feedback mapping unresolved brand to generic 'paracetamol' with 'low' severity rule
    fb_resp = client.post("/api/feedback", json={
        "analysis_id": first_data.get("analysis_id", "test-fb-loop"),
        "rating": 1,
        "unresolved_medication": unresolved_name,
        "canonical_name": "paracetamol",
        "medication_a": "paracetamol",
        "medication_b": "ibuprofen",
        "suggested_risk": "low",
        "solution_action": "Safe to take together or alternate as directed by physician.",
        "comment": "Learned from clinical feedback"
    })
    assert fb_resp.status_code == 200
    fb_data = fb_resp.json()
    assert fb_data["status"] == "success"
    assert fb_data["learning_applied"] is True

    # 3. Query the exact same combination again - it must resolve cleanly and match the learned severity
    second_resp = client.post("/api/analyze", json={
        "medications": [{"name": unresolved_name}, {"name": partner_name}]
    })
    assert second_resp.status_code == 200
    second_data = second_resp.json()
    assert len(second_data.get("not_found_or_ambiguous", [])) == 0
    assert second_data["overall_risk"] == "low"
    assert len(second_data["pair_results"]) >= 1
    pair = second_data["pair_results"][0]
    assert pair["risk_level"] == "low"
    assert "alternate" in pair["recommended_action"].lower() or "physician" in pair["recommended_action"].lower() or "alternate" in pair["plain_explanation"].lower()


def test_clear_analysis_history():
    # 1. Create an analysis
    res = client.post("/api/analyze", json={
        "medications": [{"name": "Aspirin"}, {"name": "Paracetamol"}]
    })
    assert res.status_code == 200

    # 2. Verify history endpoint has items
    list_res = client.get("/api/analyses")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 3. Clear history
    del_res = client.delete("/api/analyses")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "success"

    # 4. Verify history is cleared
    list_after = client.get("/api/analyses")
    assert list_after.status_code == 200
    assert len(list_after.json()) == 0


def test_knowledge_base_status():
    res = client.get("/api/knowledge-base/status")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "online"
    assert data["total_feeds"] == 30
    assert data["online_feeds"] == 30
    assert "Knowledge Base Online" in data["badge_text"]
    assert len(data["feeds"]) == 30


def test_combination_dataset_stats():
    res = client.get("/api/combination-dataset/stats")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "online"
    assert data["total_combinations_indexed"] >= 10
    assert data["offline_latency"] == "< 1ms"



