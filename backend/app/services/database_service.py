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
_LOCAL_DDI_RULES_BY_RXCUI: Dict[str, Dict[str, Any]] = {}
_LOCAL_SOURCES: Dict[str, Dict[str, Any]] = {}
_LOCAL_SOURCE_CHUNKS: List[Dict[str, Any]] = []
_LOCAL_ANALYSES: Dict[str, Dict[str, Any]] = {}
_LOCAL_FEEDBACK: List[Dict[str, Any]] = []
_NEGATIVE_LOOKUP_CACHE: set = set()

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


def get_ddi_rule_by_rxcui(rxcui_a: str, rxcui_b: str) -> Optional[Dict[str, Any]]:
    """Look up curated DDI rule by RxCUI pair (checks local fast cache)."""
    if not rxcui_a or not rxcui_b or rxcui_a in ["0000", "00000"] or rxcui_b in ["0000", "00000"]:
        return None

    c1, c2 = rxcui_a.strip(), rxcui_b.strip()
    key = f"{c1}|{c2}" if c1 < c2 else f"{c2}|{c1}"
    return _LOCAL_DDI_RULES_BY_RXCUI.get(key)


def get_ddi_rule(ing_a: str, ing_b: str) -> Optional[Dict[str, Any]]:
    """Look up curated DDI rule for an active ingredient pair (checks local fast cache first, then Supabase)."""
    if not ing_a or not ing_b:
        return None

    key = normalize_pair_key(ing_a, ing_b)

    # 1. Check local fast store first
    rule = _LOCAL_DDI_RULES.get(key)
    if rule:
        return rule

    # If known negative lookup, skip remote call
    if key in _NEGATIVE_LOOKUP_CACHE:
        return None

    # 2. Try Supabase fallback
    pair_a, pair_b = key.split("|")
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
                rule_item = res.data[0]
                _LOCAL_DDI_RULES[key] = rule_item
                return rule_item
            else:
                _NEGATIVE_LOOKUP_CACHE.add(key)
        except Exception as e:
            logger.error(f"Error querying Supabase ddi_rules: {e}")

    _NEGATIVE_LOOKUP_CACHE.add(key)
    return None


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
    rxcui_a: Optional[str] = None,
    rxcui_b: Optional[str] = None,
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
        "rxcui_a": rxcui_a,
        "rxcui_b": rxcui_b,
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
    _NEGATIVE_LOOKUP_CACHE.discard(key)

    # Index by RxCUI if available
    if rxcui_a and rxcui_b and rxcui_a not in ["0000", "00000"] and rxcui_b not in ["0000", "00000"]:
        c1, c2 = rxcui_a.strip(), rxcui_b.strip()
        rx_key = f"{c1}|{c2}" if c1 < c2 else f"{c2}|{c1}"
        _LOCAL_DDI_RULES_BY_RXCUI[rx_key] = rule_data

    # Persist into Supabase ddi_rules table if connected
    if supabase_client:
        try:
            existing = (
                supabase_client.table("ddi_rules")
                .select("id")
                .eq("ingredient_a", a)
                .eq("ingredient_b", b)
                .execute()
            )
            if not existing.data:
                db_record = {
                    "ingredient_a": a,
                    "ingredient_b": b,
                    "risk_level": risk_level,
                    "mechanism": mechanism,
                    "patient_friendly_summary": patient_friendly_summary,
                    "recommended_action_template": recommended_action_template,
                    "urgent_warning_template": urgent_warning_template,
                    "active": True,
                }
                supabase_client.table("ddi_rules").insert(db_record).execute()
                logger.info(f"Persisted DDI rule [{a} + {b}] into Supabase ddi_rules table.")
        except Exception as e:
            logger.error(f"Error persisting DDI rule to Supabase: {e}")


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
