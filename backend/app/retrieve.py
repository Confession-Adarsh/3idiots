"""
Knowledge-base retrieval.

Primary path  : embed query with OpenAI text-embedding-3-small → pgvector
                cosine-similarity search over entities.embedding
Fallback path : ILIKE keyword search over name | description | tags array
                (triggered on ANY embedding/DB exception)

Never raises. Always returns a list[dict] with keys:
    id, type, name, tags, location, description, score
"""

from __future__ import annotations

import logging
from typing import Any

from sqlalchemy import text

from app.db import SessionLocal

log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _embed(query_text: str) -> list[float]:
    """Return a 1536-dim embedding via OpenAI.  Raises on any failure."""
    from openai import OpenAI          # imported lazily so seed.py works without it

    client = OpenAI()                  # reads OPENAI_API_KEY from env
    resp = client.embeddings.create(
        model="text-embedding-3-small",
        input=query_text,
    )
    return resp.data[0].embedding


def _vector_search(db, embedding: list[float], k: int) -> list[dict]:
    """Cosine-distance search using pgvector <=> operator."""
    vec_literal = "[" + ",".join(str(v) for v in embedding) + "]"
    sql = text(
        """
        SELECT id, type, name, tags, location, description,
               1 - (embedding <=> :vec ::vector) AS score
        FROM   entities
        WHERE  embedding IS NOT NULL
        ORDER  BY embedding <=> :vec ::vector
        LIMIT  :k
        """
    )
    rows = db.execute(sql, {"vec": vec_literal, "k": k}).mappings().all()
    return [dict(r) for r in rows]


def _keyword_search(db, query_text: str, k: int) -> list[dict]:
    """ILIKE fallback: matches query words against name, description, tags."""
    words = [w.strip() for w in query_text.split() if w.strip()]
    if not words:
        return []

    # Build: (name ILIKE %word% OR description ILIKE %word% OR array_to_string(tags,'|') ILIKE %word%)
    clauses = " OR ".join(
        f"(name ILIKE :w{i} OR description ILIKE :w{i} "
        f"OR array_to_string(tags, ' ') ILIKE :w{i})"
        for i in range(len(words))
    )
    params = {f"w{i}": f"%{w}%" for i, w in enumerate(words)}
    params["k"] = k

    sql = text(
        f"""
        SELECT id, type, name, tags, location, description,
               0.0 AS score
        FROM   entities
        WHERE  {clauses}
        LIMIT  :k
        """
    )
    rows = db.execute(sql, params).mappings().all()
    return [dict(r) for r in rows]


def _normalise(rows: list[dict[str, Any]]) -> list[dict]:
    """Coerce uuid / array types to plain Python for JSON serialisation."""
    out = []
    for r in rows:
        out.append(
            {
                "id": str(r["id"]),
                "type": r["type"],
                "name": r["name"],
                "tags": list(r["tags"]) if r["tags"] else [],
                "location": r["location"],
                "description": r["description"],
                "score": float(r["score"]),
            }
        )
    return out


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def retrieve_kb_context(query_text: str, k: int = 8) -> list[dict]:
    """
    Return up to *k* knowledge-base entities most relevant to *query_text*.

    Never raises. Returns an empty list if both paths fail.
    """
    db = SessionLocal()
    try:
        # --- Primary: vector search -----------------------------------------
        try:
            embedding = _embed(query_text)
            rows = _vector_search(db, embedding, k)
            return _normalise(rows)
        except Exception as emb_exc:
            log.warning(
                "Embedding/vector search failed (%s); falling back to keyword search.",
                emb_exc,
            )

        # --- Fallback: keyword search ----------------------------------------
        try:
            rows = _keyword_search(db, query_text, k)
            return _normalise(rows)
        except Exception as kw_exc:
            log.error("Keyword search also failed: %s", kw_exc)
            return []

    finally:
        db.close()
