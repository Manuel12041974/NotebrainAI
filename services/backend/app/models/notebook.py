import uuid
from typing import Optional

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255))
    avatar_url: Mapped[Optional[str]] = mapped_column(String(512))

    notebooks: Mapped[list["Notebook"]] = relationship(back_populates="owner")


class Notebook(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "notebooks"

    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text)
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id")
    )

    owner: Mapped["User"] = relationship(back_populates="notebooks")
    sources: Mapped[list["Source"]] = relationship(back_populates="notebook")
    messages: Mapped[list["Message"]] = relationship(back_populates="notebook")
    generations: Mapped[list["Generation"]] = relationship(back_populates="notebook")


class Source(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "sources"

    notebook_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("notebooks.id")
    )
    type: Mapped[str] = mapped_column(String(50))  # pdf, docx, url, youtube, text
    filename: Mapped[Optional[str]] = mapped_column(String(512))
    url: Mapped[Optional[str]] = mapped_column(String(2048))
    file_path: Mapped[Optional[str]] = mapped_column(String(1024))
    parsed_content: Mapped[Optional[str]] = mapped_column(Text)
    metadata: Mapped[Optional[dict]] = mapped_column(JSONB, default={})
    status: Mapped[str] = mapped_column(String(50), default="processing")
    chunk_count: Mapped[int] = mapped_column(default=0)

    notebook: Mapped["Notebook"] = relationship(back_populates="sources")


class Message(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "messages"

    notebook_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("notebooks.id")
    )
    role: Mapped[str] = mapped_column(String(20))  # user, assistant
    content: Mapped[str] = mapped_column(Text)
    citations: Mapped[Optional[dict]] = mapped_column(JSONB)
    saved_as_note: Mapped[bool] = mapped_column(default=False)

    notebook: Mapped["Notebook"] = relationship(back_populates="messages")


class Generation(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "generations"

    notebook_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("notebooks.id")
    )
    type: Mapped[str] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(50), default="queued")
    config: Mapped[Optional[dict]] = mapped_column(JSONB, default={})
    progress: Mapped[Optional[dict]] = mapped_column(JSONB, default={})
    output_url: Mapped[Optional[str]] = mapped_column(String(1024))
    error: Mapped[Optional[str]] = mapped_column(Text)

    notebook: Mapped["Notebook"] = relationship(back_populates="generations")
