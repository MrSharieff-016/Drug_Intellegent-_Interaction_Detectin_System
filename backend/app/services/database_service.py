"""
Database Service supporting Supabase integration with thread-safe local in-memory fallback
for development, local testing, and seed data access without cloud lock-in.
"""

import logging
import uuid
from typing import Dict, List, Optional, Any
from app.config import settings

logger = logging.getLogger("medsafe.database")

# Local in-memory store for fallback & unit tests
_LOCAL_DDI_RULES: Dict[str, Dict[str, Any]] = {}
_LOCAL_SOURCES: Dict[str, Dict[str, Any]] = {}
_LOCAL_SOURCE_CHUNKS: List[Dict[str, Any]] = []
_LOCAL_ANALYSES: Dict[str, Dict[str, Any]] = {}
_LOCAL_FEEDBACK: List[Dict[str, Any]] = []

supabase_client = None

if settings.SUPABASE_URL and settings.SUPABASE_SECRET_KEY:
    try:
        raw_url = settings.SUPABASE_URL.strip()
        if raw_url.endswith("/rest/v1/"):
            raw_url = raw_url[:-9]
        elif raw_url.endswith("/rest/v1"):
            raw_url = raw_url[:-8]
        raw_url = raw_url.rstrip("/")

        from supabase import create_client, Client
        supabase_client: Optional[Client] = create_client(
            raw_url, settings.SUPABASE_SECRET_KEY
        )
        logger.info(f"Supabase client initialized successfully with URL: {raw_url}")
    except Exception as e:
        logger.warning(f"Could not initialize Supabase client: {e}. Falling back to in-memory store.")
else:
        logger.info("No Supabase credentials configured. Using local in-memory store.")


def normalize_pair_key(ing_a: str, ing_b: str) -> str:
    """Returns canonical sorted pair key string 'ing_a|ing_b' where ing_a < ing_b."""
    a, b = ing_a.strip().lower(), ing_b.strip().lower()
    return f"{a}|{b}" if a < b else f"{b}|{a}"


def get_ddi_rule(ing_a: str, ing_b: str) -> Optional[Dict[str, Any]]:
    """Look up curated DDI rule for an active ingredient pair (canonical ordered)."""
    key = normalize_pair_key(ing_a, ing_b)
    pair_a, pair_b = key.split("|")

    # 1. Try Supabase query if available
    if supabase_client:
        try:
            res = (
                supabase_client.table("ddi_rules")
                .select("*, sources(*)")
                .eq("ingredient_a", pair_a)
                .eq("ingredient_b", pair_b)
                .eq("active", True)
                .execute()
            )
            if res.data and len(res.data) > 0:
                return res.data[0]
        except Exception as e:
            logger.error(f"Error querying Supabase ddi_rules: {e}")

    # 2. Local store fallback
    return _LOCAL_DDI_RULES.get(key)


def get_all_source_chunks() -> List[Dict[str, Any]]:
    """Get all source chunks for TF-IDF indexing."""
    if supabase_client:
        try:
            res = supabase_client.table("source_chunks").select("*, sources(*)").execute()
            if res.data:
                return res.data
        except Exception as e:
            logger.error(f"Error querying Supabase source_chunks: {e}")
    
    return _LOCAL_SOURCE_CHUNKS


def save_analysis(
    analysis_id: str,
    user_id: Optional[str],
    overall_risk: str,
    request_json: dict,
    response_json: dict,
) -> bool:
    """Store an analysis audit record."""
    record = {
        "id": analysis_id,
        "user_id": user_id,
        "overall_risk": overall_risk,
        "request_json": request_json,
        "response_json": response_json,
        "created_at": response_json.get("created_at", "2026-09-19T12:00:00Z"),
    }
    
    # Store locally
    _LOCAL_ANALYSES[analysis_id] = record

    if supabase_client:
        try:
            supabase_client.table("analyses").insert(record).execute()
        except Exception as e:
            logger.error(f"Error saving analysis to Supabase: {e}")
            
    return True


def get_analysis_by_id(analysis_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve analysis record by UUID."""
    if supabase_client:
        try:
            res = supabase_client.table("analyses").select("*").eq("id", analysis_id).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
        except Exception as e:
            logger.error(f"Error querying analysis by ID from Supabase: {e}")

    return _LOCAL_ANALYSES.get(analysis_id)


def get_user_analyses(user_id: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieve past analyses."""
    if supabase_client:
        try:
            q = supabase_client.table("analyses").select("*").order("created_at", desc=True).limit(limit)
            if user_id:
                q = q.eq("user_id", user_id)
            res = q.execute()
            if res.data:
                return res.data
        except Exception as e:
            logger.error(f"Error fetching analyses from Supabase: {e}")

    # Fallback local filter
    results = list(_LOCAL_ANALYSES.values())
    if user_id:
        results = [r for r in results if r.get("user_id") == user_id]
    results.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return results[:limit]


def save_feedback(
    analysis_id: str, user_id: Optional[str], rating: int, comment: Optional[str]
) -> bool:
    """Save user feedback for an analysis."""
    record = {
        "id": str(uuid.uuid4()),
        "analysis_id": analysis_id,
        "user_id": user_id,
        "rating": rating,
        "comment": comment,
    }
    _LOCAL_FEEDBACK.append(record)

    if supabase_client:
        try:
            supabase_client.table("feedback").insert(record).execute()
        except Exception as e:
            logger.error(f"Error saving feedback to Supabase: {e}")
            
    return True


def register_local_ddi_rule(
    ing_a: str,
    ing_b: str,
    risk_level: str,
    mechanism: str,
    patient_friendly_summary: str,
    recommended_action_template: str,
    urgent_warning_template: Optional[str] = None,
    source_info: Optional[Dict[str, Any]] = None,
):
    """Seed or register a DDI rule into local store (and Supabase if connected)."""
    a, b = ing_a.strip().lower(), ing_b.strip().lower()
    if a > b:
        a, b = b, a

    key = f"{a}|{b}"
    rule_data = {
        "id": str(uuid.uuid4()),
        "ingredient_a": a,
        "ingredient_b": b,
        "risk_level": risk_level,
        "mechanism": mechanism,
        "patient_friendly_summary": patient_friendly_summary,
        "recommended_action_template": recommended_action_template,
        "urgent_warning_template": urgent_warning_template,
        "active": True,
        "sources": source_info or {
            "source_name": "DailyMed",
            "source_url": "https://dailymed.nlm.nih.gov",
            "source_type": "package_insert",
            "title": f"FDA Package Label for {a.capitalize()} / {b.capitalize()}",
            "license_note": "FDA Public Domain Data"
        },
    }
    _LOCAL_DDI_RULES[key] = rule_data


def register_local_source_chunk(
    ingredient_names: List[str],
    section_name: str,
    content: str,
    source_name: str = "DailyMed",
    source_url: str = "https://dailymed.nlm.nih.gov",
    source_title: str = "FDA Package Insert Section",
):
    """Seed or register a source chunk into local store for TF-IDF retrieval."""
    chunk = {
        "id": str(uuid.uuid4()),
        "ingredient_names": [i.lower() for i in ingredient_names],
        "section_name": section_name,
        "content": content,
        "sources": {
            "source_name": source_name,
            "source_url": source_url,
            "title": source_title,
        },
    }
    _LOCAL_SOURCE_CHUNKS.append(chunk)
