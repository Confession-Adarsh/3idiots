"""
POST /search
Wire retrieve_kb_context → classify_search and return ranked, cited results.
Also fetches live results from Commudle and other authentic platforms via DuckDuckGo.
"""

from __future__ import annotations

import logging
import re
from concurrent.futures import ThreadPoolExecutor, as_completed

from fastapi import APIRouter

from app.llm_router import classify_search
from app.retrieve import retrieve_kb_context
from app.schemas import SearchRequest, SearchResponse, SearchResultItem

log = logging.getLogger(__name__)

router = APIRouter(prefix="/search", tags=["search"])

# Thread pool for parallel web + local search
_pool = ThreadPoolExecutor(max_workers=3)


def _fetch_web_results(query: str, search_prefix: str, source_name: str, max_results: int = 5, base_score: float = 0.95) -> list[SearchResultItem]:
    """Search authentic platforms via DuckDuckGo and return formatted results."""
    try:
        from duckduckgo_search import DDGS
        with DDGS() as ddgs:
            ddg_results = list(ddgs.text(
                f"{search_prefix} {query}",
                max_results=max_results,
            ))

        items: list[SearchResultItem] = []
        for i, r in enumerate(ddg_results):
            url = r.get("href", "")
            title = r.get("title", "")[:120]
            body = r.get("body", "")[:300]

            # Classify by URL pattern
            if "/communities/" in url or "/group/" in url:
                result_type = "community"
            elif "/events/" in url or "event" in title.lower() or "lu.ma" in url or "meetup" in url:
                result_type = "event"
            elif "/users/" in url or "/profile/" in url:
                result_type = "person"
            else:
                result_type = "event"

            # Extract location from title/body if possible
            location_match = re.search(
                r"\b(Lucknow|Delhi|Bangalore|Bengaluru|Pune|Mumbai|Hyderabad|Chennai|Kolkata|Jaipur|India)\b",
                title + " " + body,
                re.IGNORECASE,
            )
            
            # Use domain as default location
            domain_match = re.search(r"https?://(?:www\.)?([^/]+)", url)
            default_loc = domain_match.group(1) if domain_match else source_name
            location = location_match.group(0).title() if location_match else default_loc

            items.append(SearchResultItem(
                id=f"{source_name.lower().replace(' ', '')}-{i}",
                type=result_type,
                name=title,
                tags=[source_name.lower().replace(" ", ""), "live"],
                location=location,
                description=body,
                url=url,
                retrieval_score=base_score - (i * 0.05),  # rank by DDG order + priority
                reason=f"Live from {source_name}",
            ))
        return items
    except Exception as e:
        log.warning("%s web search failed: %s", source_name, e)
        return []


@router.post("", response_model=SearchResponse, summary="Semantic + LLM-ranked entity search")
def search(req: SearchRequest) -> SearchResponse:
    """
    Full pipeline:
    1. retrieve_kb_context  — embedding (or keyword fallback) → top-k entity chunks
    2. classify_search      — 3-tier LLM router → relevance judgement + injection check
    3. Live search Commudle — DuckDuckGo site:commudle.com (highest priority)
    4. Live search Others   — DuckDuckGo site:meetup.com OR site:lu.ma OR site:devfolio.co
    5. Merge & rank         — blend web + local results
    """
    # Launch Commudle web search (High priority: base_score 0.95)
    commudle_future = _pool.submit(_fetch_web_results, req.query, "site:commudle.com", "Commudle", 4, 0.95)
    
    # Launch Other Platforms search (Medium priority: base_score 0.85)
    other_platforms_future = _pool.submit(_fetch_web_results, req.query, "(site:meetup.com OR site:lu.ma OR site:devfolio.co)", "Web Event Platform", 3, 0.85)

    # Step 1: retrieve from local DB
    kb_chunks: list[dict] = retrieve_kb_context(req.query, k=req.k)

    # Step 2: classify with LLM router
    classification = classify_search(req.query, kb_chunks)

    tier_used = classification.get("_tier", "unknown")
    injection_detected: bool = classification.get("injection_detected", False)

    if injection_detected:
        # Cancel/ignore web results for injection attacks
        commudle_future.cancel()
        other_platforms_future.cancel()
        return SearchResponse(
            query=req.query,
            injection_detected=True,
            tier_used=tier_used,
            confidence=classification.get("confidence", 0.0),
            results=[],
        )

    # Step 3: merge local results
    chunk_by_id: dict[str, dict] = {c["id"]: c for c in kb_chunks}

    local_results: list[SearchResultItem] = []
    for match in classification.get("matches", []):
        entity_id = match.get("id", "")
        chunk = chunk_by_id.get(entity_id)
        if chunk is None:
            continue

        local_results.append(
            SearchResultItem(
                id=entity_id,
                type=chunk.get("type", ""),
                name=chunk.get("name", ""),
                tags=chunk.get("tags") or [],
                location=chunk.get("location"),
                description=chunk.get("description"),
                # Cap local max score below Commudle but above generic web
                retrieval_score=min(0.9, float(chunk.get("score", 0.0))),
                reason=match.get("reason", ""),
            )
        )

    local_results.sort(key=lambda r: r.retrieval_score, reverse=True)

    # Step 4: collect Live web results
    web_results = []
    try:
        web_results.extend(commudle_future.result(timeout=8.0))
    except Exception as e:
        log.warning("Commudle web search timed out: %s", e)
        
    try:
        web_results.extend(other_platforms_future.result(timeout=8.0))
    except Exception as e:
        log.warning("Other platforms web search timed out: %s", e)

    # Sort web results by score (Commudle > Other Platforms)
    web_results.sort(key=lambda r: r.retrieval_score, reverse=True)

    # Blend: Web results first, then local
    all_results = web_results + local_results
    if web_results:
        tier_used = f"{tier_used} + live-web"

    return SearchResponse(
        query=req.query,
        injection_detected=False,
        tier_used=tier_used,
        confidence=classification.get("confidence", 0.0),
        results=all_results,
    )
