import asyncio
from datetime import datetime, timezone
from io import BytesIO
from fastapi.testclient import TestClient
from PIL import Image
from pydantic import ValidationError
import pytest
from types import SimpleNamespace

from app.dependencies import get_current_user
from app.main import app
from app.models import UserRole
from app.routers.articles import slugify
from app.schemas import ArticleCreate, ArticleScheduleRequest
from app.services.media_storage import InvalidImage, InvalidVideo, LocalArticleImageStorage, LocalArticleVideoStorage


def test_slugify_article_title() -> None:
    assert slugify("Helping Kids Sleep Better!") == "helping-kids-sleep-better"


def test_publishing_requires_authentication() -> None:
    response = TestClient(app).post(
        "/api/v1/articles",
        json={"title": "A useful guide", "content": "Enough article content", "status": "draft"},
    )
    assert response.status_code == 401


def test_media_upload_requires_authentication() -> None:
    response = TestClient(app).post(
        "/api/v1/articles/upload/media",
        files={"file": ("image.png", b"fake", "image/png")},
    )
    assert response.status_code == 401


def test_regular_user_cannot_publish() -> None:
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
        id="00000000-0000-0000-0000-000000000001", role=UserRole.USER
    )
    try:
        response = TestClient(app).post(
            "/api/v1/articles",
            json={"title": "A useful guide", "content": "Enough article content", "status": "published"},
        )
        assert response.status_code == 403
        assert response.json()["detail"] == "Insufficient permissions"
    finally:
        app.dependency_overrides.clear()


def test_regular_user_cannot_upload_article_media() -> None:
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
        id="00000000-0000-0000-0000-000000000001", role=UserRole.USER
    )
    try:
        response = TestClient(app).post(
            "/api/v1/articles/upload/media",
            files={"file": ("image.png", b"fake", "image/png")},
        )
        assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


def test_regular_user_cannot_delete_article_media() -> None:
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
        id="00000000-0000-0000-0000-000000000001", role=UserRole.USER
    )
    try:
        response = TestClient(app).delete(
            "/api/v1/articles/media/00000000-0000-0000-0000-000000000002"
        )
        assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


def test_article_content_accepts_supported_structured_nodes() -> None:
    article = ArticleCreate(
        title="Structured article",
        content={
            "type": "doc",
            "content": [
                {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Heading", "marks": [{"type": "bold"}]}]},
                {"type": "paragraph", "content": [{"type": "text", "text": "Useful text", "marks": [{"type": "link", "attrs": {"href": "https://example.com"}}]}]},
                {"type": "youtube", "attrs": {"src": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}},
            ],
        },
    )
    assert article.content["type"] == "doc"


@pytest.mark.parametrize(
    "content",
    [
        {"type": "doc", "content": [{"type": "html", "attrs": {"html": "<script>alert(1)</script>"}}]},
        {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "unsafe", "marks": [{"type": "link", "attrs": {"href": "javascript:alert(1)"}}]}]}]},
        {"type": "doc", "content": [{"type": "youtube", "attrs": {"src": "https://example.com/embed/video"}}]},
        {"type": "doc", "content": [{"type": "articleImage", "attrs": {"src": "https://example.com/image.jpg"}}]},
    ],
)
def test_article_content_rejects_unsafe_nodes_and_urls(content: dict) -> None:
    with pytest.raises(ValidationError):
        ArticleCreate(title="Unsafe article", content=content)


def test_schedule_requires_timezone_aware_datetime() -> None:
    with pytest.raises(ValidationError):
        ArticleScheduleRequest(scheduled_at=datetime(2030, 1, 1, 12, 0))
    request = ArticleScheduleRequest(scheduled_at=datetime(2030, 1, 1, 12, 0, tzinfo=timezone.utc))
    assert request.scheduled_at.utcoffset() is not None


def test_image_storage_validates_and_resizes_real_images(tmp_path) -> None:
    source = BytesIO()
    Image.new("RGB", (3200, 100), "#19716c").save(source, format="PNG")
    storage = LocalArticleImageStorage(tmp_path)
    stored = storage.save(source.getvalue())

    assert stored.mime_type == "image/png"
    assert stored.width == 3000
    assert stored.height < 100
    assert stored.storage_key.startswith("articles/")
    assert (tmp_path / stored.storage_key).is_file()


def test_image_storage_rejects_disguised_non_image(tmp_path) -> None:
    with pytest.raises(InvalidImage):
        LocalArticleImageStorage(tmp_path).save(b"<script>alert('not an image')</script>")


def test_article_content_accepts_uploaded_video_node() -> None:
    article = ArticleCreate(title="Video article", content={"type": "doc", "content": [{"type": "articleVideo", "attrs": {"src": "/uploads/articles/example.mp4", "caption": "Demo"}}]})
    assert article.content["content"][0]["type"] == "articleVideo"


def test_article_content_rejects_external_video_node() -> None:
    with pytest.raises(ValidationError):
        ArticleCreate(title="Unsafe video", content={"type": "doc", "content": [{"type": "articleVideo", "attrs": {"src": "https://example.com/video.mp4"}}]})


def test_video_storage_accepts_mp4_signature(tmp_path) -> None:
    stored = LocalArticleVideoStorage(tmp_path).save(b"\x00\x00\x00\x18ftypisom" + b"\x00" * 64)
    assert stored.mime_type == "video/mp4"
    assert stored.storage_key.endswith(".mp4")
    assert (tmp_path / stored.storage_key).is_file()


def test_video_storage_rejects_disguised_file(tmp_path) -> None:
    with pytest.raises(InvalidVideo):
        LocalArticleVideoStorage(tmp_path).save(b"not a video file")


def test_publication_scheduler_invokes_due_article_publisher(monkeypatch) -> None:
    import app.services.publication_scheduler as scheduler_module

    calls: list[object] = []
    stop = asyncio.Event()

    class FakeSession:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *_args):
            return False

    async def fake_publish(db):
        calls.append(db)
        stop.set()

    monkeypatch.setattr(scheduler_module, "SessionLocal", lambda: FakeSession())
    monkeypatch.setattr(scheduler_module, "publish_due_articles", fake_publish)
    asyncio.run(scheduler_module.run_publication_scheduler(stop, interval_seconds=1))
    assert len(calls) == 1
