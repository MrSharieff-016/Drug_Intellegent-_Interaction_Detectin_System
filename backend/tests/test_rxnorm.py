"""
Unit tests for RxNorm medication normalization and autocomplete suggestions.
"""

import pytest
from app.services.rxnorm_service import (
    normalize_medication_name,
    get_medication_suggestions,
)


@pytest.mark.asyncio
async def test_rxnorm_known_brand_resolution():
    norm = await normalize_medication_name("Advil")
    assert norm.entered_name == "Advil"
    assert norm.canonical_name == "ibuprofen"
    assert norm.rxcui == "5640"


@pytest.mark.asyncio
async def test_rxnorm_known_generic_resolution():
    norm = await normalize_medication_name("warfarin")
    assert norm.entered_name == "warfarin"
    assert norm.canonical_name == "warfarin"
    assert norm.rxcui == "11289"


@pytest.mark.asyncio
async def test_rxnorm_autocomplete_suggestions():
    suggestions = await get_medication_suggestions("warf")
    assert len(suggestions) > 0
    names = [s.name.lower() for s in suggestions]
    assert any("warfarin" in n for n in names)
