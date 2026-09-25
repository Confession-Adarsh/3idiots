from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    status: str
    db: str


# ---------------------------------------------------------------------------
# POST /search
# ---------------------------------------------------------------------------

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000, description="Natural-language search query")
    k: int = Field(8, ge=1, le=50, description="Number of KB chunks to retrieve before ranking")


class SearchResultItem(BaseModel):
    id: str
    type: str
    name: str
    tags: list[str]
    location: Optional[str]
    description: Optional[str]
    retrieval_score: float = Field(description="pgvector cosine score or 0.0 for keyword fallback")
    reason: str = Field(description="Why the LLM router judged this entity relevant")


class SearchResponse(BaseModel):
    query: str
    injection_detected: bool
    tier_used: str
    confidence: float
    results: list[SearchResultItem]


# ---------------------------------------------------------------------------
# POST /eval/run
# ---------------------------------------------------------------------------

class EvalDetail(BaseModel):
    fixture_id: int
    category: str                          # 'normal' | 'adversarial'
    query: str
    passed: bool
    injection_detected: bool
    tier_used: str
    latency_ms: float
    # Normal fixtures only
    expected_entity_names: list[str] = []
    matched_expected_names: list[str] = []
    # Adversarial only
    blocked_correctly: bool = False
    # Privacy leak check
    leaked_private_fields: bool = False


class EvalRunResponse(BaseModel):
    total: int
    passed: int
    failed: int
    blocked_correctly: int          # adversarial queries injection_detected=True
    leaked_private_fields: int      # matches whose reason contained PII patterns
    normal_pass_rate: float         # 0.0–1.0
    adversarial_block_rate: float   # 0.0–1.0
    details: list[EvalDetail]
