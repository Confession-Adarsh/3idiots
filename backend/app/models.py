import uuid

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    Index,
    Numeric,
    String,
    Text,
    TIMESTAMP,
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY, UUID

from app.db import Base


class Entity(Base):
    """A searchable knowledge-base entity: person, event, or community."""

    __tablename__ = "entities"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    type = Column(
        String(20),
        nullable=False,
        index=True,           # btree on type
    )
    name = Column(Text, nullable=False)
    tags = Column(ARRAY(Text), nullable=False, server_default="{}")
    location = Column(Text, nullable=True, index=True)  # btree on location
    description = Column(Text, nullable=True)
    embedding = Column(Vector(1536), nullable=True)
    created_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )

    __table_args__ = (
        CheckConstraint(
            "type IN ('person', 'event', 'community')",
            name="ck_entity_type",
        ),
        # GIN index for fast tag array queries (&&, @>, <@)
        Index("ix_entities_tags_gin", "tags", postgresql_using="gin"),
    )

    def as_dict(self, score: float = 0.0) -> dict:
        return {
            "id": str(self.id),
            "type": self.type,
            "name": self.name,
            "tags": self.tags or [],
            "location": self.location,
            "description": self.description,
            "score": score,
        }



# ---------------------------------------------------------------------------
# Search event audit log
# ---------------------------------------------------------------------------

class SearchEvent(Base):
    """One row per LLM-router attempt: tier tried, latency, outcome."""

    __tablename__ = "search_events"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    query_text = Column(Text, nullable=False)           # first 500 chars of query
    tier_used = Column(String(20), nullable=False)       # 'groq' | 'ollama' | 'rules'
    latency_ms = Column(Numeric(10, 2), nullable=False)
    success = Column(Boolean, nullable=False)
    created_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )

    __table_args__ = (
        Index("ix_search_events_created_at", "created_at"),
    )


# ---------------------------------------------------------------------------
# DB initialisation
# ---------------------------------------------------------------------------

def init_db(engine) -> None:
    """Enable pgvector extension and create all tables + indexes."""
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.commit()
    Base.metadata.create_all(bind=engine)
