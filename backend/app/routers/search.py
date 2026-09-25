"""
POST /search
Wire retrieve_kb_context → classify_search and return ranked, cited results.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter

from app.llm_router import classify_search
from app.retrieve import retrieve_kb_context
from app.schemas import SearchRequest, SearchResponse, SearchResultItem

log = logging.getLogger(__name__)

router = APIRouter(prefix="/search", tags=["search"])


@router.post("", response_model=SearchResponse, summary="Semantic + LLM-ranked entity search")
def search(req: SearchRequest) -> SearchResponse:
    """
    Full pipeline:
    1. retrieve_kb_context  — embedding (or keyword fallback) → top-k entity chunks
    2. classify_search      — 3-tier LLM router → relevance judgement + injection check
    3. Merge & rank         — join retrieval scores with LLM-supplied reasons

    When injection_detected is True the results list is empty and a 200 is still
    returned (no 4xx — the client should inspect injection_detected).
    """
    # Step 1: retrieve
    kb_chunks: list[dict] = retrieve_kb_context(req.query, k=req.k)

    # Step 2: classify
    classification = classify_search(req.query, kb_chunks)

    tier_used = classification.get("_tier", "unknown")
    injection_detected: bool = classification.get("injection_detected", False)

    if injection_detected:
        return SearchResponse(
            query=req.query,
            injection_detected=True,
            tier_used=tier_used,
            confidence=classification.get("confidence", 0.0),
            results=[],
        )

    # Step 3: merge — index chunks by id for O(1) lookup
    chunk_by_id: dict[str, dict] = {c["id"]: c for c in kb_chunks}

    results: list[SearchResultItem] = []
    for match in classification.get("matches", []):
        entity_id = match.get("id", "")
        chunk = chunk_by_id.get(entity_id)
        if chunk is None:
            # LLM hallucinated an id not in retrieved set — skip
            log.warning("search: LLM returned unknown entity id=%s — skipping", entity_id)
            continue

        results.append(
            SearchResultItem(
                id=entity_id,
                type=chunk.get("type", ""),
                name=chunk.get("name", ""),
                tags=chunk.get("tags") or [],
                location=chunk.get("location"),
                description=chunk.get("description"),
                retrieval_score=float(chunk.get("score", 0.0)),
                reason=match.get("reason", ""),
            )
        )

    # Sort by retrieval score descending so the most semantically close results
    # surface first within the LLM's approved set.
    results.sort(key=lambda r: r.retrieval_score, reverse=True)

    return SearchResponse(
        query=req.query,
        injection_detected=False,
        tier_used=tier_used,
        confidence=classification.get("confidence", 0.0),
        results=results,
    )
