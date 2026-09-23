import uuid
from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator
from app.models import ArticleStatus, ContactStatus, UserRole, VisitStatus

class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=120)
    password: str = Field(min_length=8, max_length=128)

class PatientCreateRequest(RegisterRequest):
    phone: str = Field(min_length=10, max_length=20)
    additional_notes: str = Field(default="", max_length=2000)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    email: EmailStr
    phone: str | None
    full_name: str
    role: UserRole
    is_superuser: bool
    is_active: bool
    created_at: datetime

class PatientResponse(UserResponse):
    additional_notes: str

class PatientAdditionalNotesUpdate(BaseModel):
    additional_notes: str = Field(max_length=2000)

class RoleUpdate(BaseModel):
    role: UserRole


class AdminUserCreate(RegisterRequest):
    phone: str | None = Field(default=None, min_length=7, max_length=20, pattern=r"^\+?[0-9۰-۹٠-٩()\-\s]{7,20}$")
    role: UserRole = UserRole.USER

EMPTY_ARTICLE_CONTENT: dict[str, Any] = {"type": "doc", "content": [{"type": "paragraph"}]}
ALLOWED_ARTICLE_NODES = {"doc", "paragraph", "heading", "text", "bulletList", "orderedList", "listItem", "blockquote", "codeBlock", "horizontalRule", "hardBreak", "articleImage", "articleVideo", "youtube"}
ALLOWED_ARTICLE_MARKS = {"bold", "italic", "underline", "strike", "code", "link"}


def validate_article_content(value: Any) -> dict[str, Any]:
    if isinstance(value, str):
        text = value.strip()
        return {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": text}]}]} if text else EMPTY_ARTICLE_CONTENT.copy()
    if not isinstance(value, dict) or value.get("type") != "doc":
        raise ValueError("Article content must be a Tiptap JSON document")
    seen = 0

    def inspect(node: Any, depth: int = 0) -> None:
        nonlocal seen
        seen += 1
        if seen > 5000 or depth > 30 or not isinstance(node, dict):
            raise ValueError("Article content is too large or deeply nested")
        node_type = node.get("type")
        if node_type not in ALLOWED_ARTICLE_NODES:
            raise ValueError(f"Unsupported article node: {node_type}")
        if node_type == "text" and (not isinstance(node.get("text", ""), str) or len(node.get("text", "")) > 100_000):
            raise ValueError("Invalid article text node")
        for mark in node.get("marks", []):
            if not isinstance(mark, dict) or mark.get("type") not in ALLOWED_ARTICLE_MARKS:
                raise ValueError("Unsupported article formatting")
            if mark.get("type") == "link":
                href = str(mark.get("attrs", {}).get("href", ""))
                if not href.startswith(("https://", "http://", "mailto:", "tel:")):
                    raise ValueError("Links must use http, https, mailto, or tel")
        attrs = node.get("attrs") or {}
        if not isinstance(attrs, dict):
            raise ValueError("Invalid article node attributes")
        if node_type == "heading" and attrs.get("level") not in {1, 2, 3}:
            raise ValueError("Only heading levels 1 through 3 are supported")
        if node_type == "articleImage":
            src = str(attrs.get("src", ""))
            if not src.startswith("/uploads/"):
                raise ValueError("Article images must reference an uploaded image")
            if len(str(attrs.get("alt", ""))) > 300 or len(str(attrs.get("caption", ""))) > 500:
                raise ValueError("Image alternative text or caption is too long")
        if node_type == "articleVideo":
            src = str(attrs.get("src", ""))
            if not src.startswith("/uploads/"):
                raise ValueError("Article videos must reference an uploaded video")
            if len(str(attrs.get("caption", ""))) > 500:
                raise ValueError("Video caption is too long")
        if node_type == "youtube":
            src = str(attrs.get("src", ""))
            if not src.startswith(("https://www.youtube.com/", "https://youtube.com/", "https://youtu.be/", "https://www.youtube-nocookie.com/")):
                raise ValueError("Only YouTube embeds are supported")
        children = node.get("content", [])
        if children is not None and not isinstance(children, list):
            raise ValueError("Invalid article content")
        for child in children or []:
            inspect(child, depth + 1)

    inspect(value)
    return value


def validate_optional_media_url(value: str | None) -> str | None:
    if value in (None, ""):
        return None
    if not value.startswith("/uploads/"):
        raise ValueError("Media must reference an uploaded article image")
    return value


class ArticleCreate(BaseModel):
    title: str = Field(min_length=3, max_length=180)
    slug: str | None = Field(default=None, max_length=200)
    excerpt: str = Field(default="", max_length=320)
    content: dict[str, Any] = Field(default_factory=lambda: EMPTY_ARTICLE_CONTENT.copy())
    featured_image_url: str | None = Field(default=None, max_length=500)
    social_image_url: str | None = Field(default=None, max_length=500)
    category_id: uuid.UUID | None = None
    tag_ids: list[uuid.UUID] = Field(default_factory=list, max_length=20)
    seo_title: str | None = Field(default=None, max_length=120)
    meta_description: str | None = Field(default=None, max_length=320)
    media_ids: list[uuid.UUID] = Field(default_factory=list, max_length=100)

    _content = field_validator("content", mode="before")(validate_article_content)
    _featured = field_validator("featured_image_url", mode="before")(validate_optional_media_url)
    _social = field_validator("social_image_url", mode="before")(validate_optional_media_url)


class ArticleUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=180)
    slug: str | None = Field(default=None, max_length=200)
    excerpt: str | None = Field(default=None, max_length=320)
    content: dict[str, Any] | None = None
    featured_image_url: str | None = Field(default=None, max_length=500)
    social_image_url: str | None = Field(default=None, max_length=500)
    category_id: uuid.UUID | None = None
    tag_ids: list[uuid.UUID] | None = Field(default=None, max_length=20)
    seo_title: str | None = Field(default=None, max_length=120)
    meta_description: str | None = Field(default=None, max_length=320)
    media_ids: list[uuid.UUID] | None = Field(default=None, max_length=100)

    _content = field_validator("content", mode="before")(lambda value: None if value is None else validate_article_content(value))
    _featured = field_validator("featured_image_url", mode="before")(validate_optional_media_url)
    _social = field_validator("social_image_url", mode="before")(validate_optional_media_url)


class ArticleWrite(ArticleCreate):
    """Backward-compatible full write payload used by older clients."""
    status: ArticleStatus = ArticleStatus.DRAFT


class ArticleScheduleRequest(BaseModel):
    scheduled_at: datetime

    @model_validator(mode="after")
    def timezone_is_required(self):
        if self.scheduled_at.tzinfo is None or self.scheduled_at.utcoffset() is None:
            raise ValueError("scheduled_at must include a timezone")
        return self

class ArticleAuthor(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    full_name: str
    role: UserRole

class MediaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    url: str
    media_type: str
    mime_type: str
    original_name: str
    storage_key: str
    alt_text: str
    caption: str
    width: int | None
    height: int | None
    file_size: int


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    slug: str


class TagResponse(CategoryResponse):
    pass


class TagCreate(BaseModel):
    name: str = Field(min_length=2, max_length=60)

class ArticleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    slug: str
    excerpt: str
    content: dict[str, Any]
    status: ArticleStatus
    featured_image_url: str | None
    social_image_url: str | None
    seo_title: str | None
    meta_description: str | None
    category: CategoryResponse | None
    tags: list[TagResponse]
    created_at: datetime
    updated_at: datetime
    published_at: datetime | None
    scheduled_at: datetime | None
    author: ArticleAuthor
    media: list[MediaResponse]

class ContactRequestCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=7, max_length=30, pattern=r"^\+?[0-9۰-۹٠-٩()\-\s]{7,30}$")
    description: str = Field(min_length=5, max_length=2000)

class ContactStatusUpdate(BaseModel):
    status: ContactStatus
    follow_up_notes: str = Field(default="", max_length=2000)

class ContactRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    full_name: str
    phone: str
    description: str
    follow_up_notes: str
    status: ContactStatus
    created_at: datetime
    contacted_at: datetime | None

class VisitWrite(BaseModel):
    scheduled_at: datetime
    status: VisitStatus = VisitStatus.SCHEDULED
    description: str = Field(default="", max_length=5000)
    medications: str = Field(default="", max_length=3000)
    address: str = Field(default="", max_length=500)

class VisitDoctor(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    full_name: str


class PatientListVisit(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    scheduled_at: datetime
    status: VisitStatus
    doctor: VisitDoctor


class PatientListResponse(UserResponse):
    next_visit: PatientListVisit | None = None
    latest_completed_visit: PatientListVisit | None = None


class VisitPatient(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    full_name: str
    email: EmailStr
    phone: str | None

class VisitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    patient_id: uuid.UUID
    scheduled_at: datetime
    status: VisitStatus
    description: str
    medications: str
    address: str
    created_at: datetime
    updated_at: datetime
    doctor: VisitDoctor
    patient: VisitPatient

class PatientDetailResponse(PatientResponse):
    visits: list[VisitResponse]
