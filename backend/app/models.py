import enum
import uuid
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, String, Table, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class UserRole(str, enum.Enum):
    USER = "user"
    DOCTOR = "doctor"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(20), unique=True, index=True, nullable=True)
    full_name: Mapped[str] = mapped_column(String(120))
    additional_notes: Mapped[str] = mapped_column(Text, default="", server_default="")
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, values_callable=lambda roles: [role.value for role in roles]),
        default=UserRole.USER,
    )
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    articles: Mapped[list["Article"]] = relationship(back_populates="author")

class ArticleStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    SCHEDULED = "scheduled"

class ContactStatus(str, enum.Enum):
    NEW = "new"
    CONTACTED = "contacted"

class VisitStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

article_tags = Table(
    "article_tags",
    Base.metadata,
    Column("article_id", ForeignKey("articles.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Category(Base):
    __tablename__ = "categories"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(80), unique=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    articles: Mapped[list["Article"]] = relationship(back_populates="category")


class Tag(Base):
    __tablename__ = "tags"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(60), unique=True)
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    articles: Mapped[list["Article"]] = relationship(secondary=article_tags, back_populates="tags")


class Article(Base):
    __tablename__ = "articles"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    author_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(180))
    slug: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    excerpt: Mapped[str] = mapped_column(String(320), default="")
    content: Mapped[dict] = mapped_column(JSONB)
    status: Mapped[ArticleStatus] = mapped_column(
        Enum(ArticleStatus, values_callable=lambda statuses: [status.value for status in statuses]),
        default=ArticleStatus.DRAFT,
        index=True,
    )
    featured_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    social_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    seo_title: Mapped[str | None] = mapped_column(String(120), nullable=True)
    meta_description: Mapped[str | None] = mapped_column(String(320), nullable=True)
    category_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    author: Mapped[User] = relationship(back_populates="articles")
    category: Mapped[Category | None] = relationship(back_populates="articles")
    tags: Mapped[list[Tag]] = relationship(secondary=article_tags, back_populates="articles")
    media: Mapped[list["MediaAsset"]] = relationship(back_populates="article")

class MediaAsset(Base):
    __tablename__ = "media_assets"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    article_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("articles.id", ondelete="SET NULL"), nullable=True, index=True)
    uploaded_by_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    url: Mapped[str] = mapped_column(String(500))
    storage_key: Mapped[str] = mapped_column(String(500), unique=True)
    media_type: Mapped[str] = mapped_column(String(20), default="image")
    mime_type: Mapped[str] = mapped_column(String(100))
    original_name: Mapped[str] = mapped_column(String(255))
    alt_text: Mapped[str] = mapped_column(String(300), default="", server_default="")
    caption: Mapped[str] = mapped_column(String(500), default="", server_default="")
    width: Mapped[int | None] = mapped_column(nullable=True)
    height: Mapped[int | None] = mapped_column(nullable=True)
    file_size: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    article: Mapped[Article | None] = relationship(back_populates="media")

class ContactRequest(Base):
    __tablename__ = "contact_requests"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    full_name: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str] = mapped_column(String(30), index=True)
    description: Mapped[str] = mapped_column(Text)
    follow_up_notes: Mapped[str] = mapped_column(Text, default="", server_default="")
    status: Mapped[ContactStatus] = mapped_column(
        Enum(ContactStatus, values_callable=lambda statuses: [status.value for status in statuses]),
        default=ContactStatus.NEW,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    contacted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

class Visit(Base):
    __tablename__ = "visits"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    doctor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), index=True)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    status: Mapped[VisitStatus] = mapped_column(
        Enum(VisitStatus, values_callable=lambda statuses: [status.value for status in statuses]),
        default=VisitStatus.SCHEDULED,
        index=True,
    )
    description: Mapped[str] = mapped_column(Text, default="")
    medications: Mapped[str] = mapped_column(Text, default="")
    address: Mapped[str] = mapped_column(String(500), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    patient: Mapped[User] = relationship(foreign_keys=[patient_id])
    doctor: Mapped[User] = relationship(foreign_keys=[doctor_id])
