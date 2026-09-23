import re
import unicodedata
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException
from sqlalchemy import or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Article, ArticleStatus, Category, MediaAsset, Tag, User, UserRole
from app.schemas import ArticleCreate, ArticleUpdate


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKC", value).strip().lower().replace("_", "-")
    slug = re.sub(r"[^\w]+", "-", normalized, flags=re.UNICODE).strip("-")
    slug = re.sub(r"-+", "-", slug)
    return slug[:190].strip("-") or "article"


def article_query():
    return select(Article).options(
        selectinload(Article.author),
        selectinload(Article.category),
        selectinload(Article.tags),
        selectinload(Article.media),
    )


async def get_article(db: AsyncSession, article_id: uuid.UUID) -> Article:
    article = await db.scalar(article_query().where(Article.id == article_id))
    if not article:
        raise HTTPException(404, "Article not found")
    return article


async def resolve_slug(db: AsyncSession, requested: str | None, title: str, article_id: uuid.UUID | None = None) -> str:
    base = slugify(requested or title)
    query = select(Article.id).where(Article.slug == base)
    if article_id:
        query = query.where(Article.id != article_id)
    if await db.scalar(query) is None:
        return base
    if requested:
        raise HTTPException(409, "An article with this slug already exists")
    counter = 2
    while await db.scalar(select(Article.id).where(Article.slug == f"{base}-{counter}")) is not None:
        counter += 1
    return f"{base}-{counter}"


async def resolve_category(db: AsyncSession, category_id: uuid.UUID | None) -> Category | None:
    if category_id is None:
        return None
    category = await db.get(Category, category_id)
    if not category:
        raise HTTPException(422, "Selected category does not exist")
    return category


async def resolve_tags(db: AsyncSession, tag_ids: list[uuid.UUID]) -> list[Tag]:
    unique_ids = list(dict.fromkeys(tag_ids))
    if not unique_ids:
        return []
    tags = (await db.scalars(select(Tag).where(Tag.id.in_(unique_ids)))).all()
    if len(tags) != len(unique_ids):
        raise HTTPException(422, "One or more selected tags do not exist")
    return list(tags)


def referenced_media_urls(node: Any) -> set[str]:
    if not isinstance(node, dict):
        return set()
    urls = set()
    if node.get("type") in {"articleImage", "articleVideo"}:
        src = node.get("attrs", {}).get("src")
        if isinstance(src, str):
            urls.add(src)
    for child in node.get("content", []) or []:
        urls.update(referenced_media_urls(child))
    return urls


def has_publishable_content(node: Any) -> bool:
    if not isinstance(node, dict):
        return False
    if node.get("type") == "text" and str(node.get("text", "")).strip():
        return True
    if node.get("type") in {"articleImage", "articleVideo", "youtube"}:
        return True
    return any(has_publishable_content(child) for child in node.get("content", []) or [])


async def attach_and_validate_media(
    db: AsyncSession,
    article: Article,
    user: User,
    media_ids: list[uuid.UUID],
) -> None:
    requested_ids = list(dict.fromkeys(media_ids))
    if requested_ids:
        ownership = MediaAsset.uploaded_by_id == user.id if user.role != UserRole.ADMIN else True
        assets = (await db.scalars(select(MediaAsset).where(
            MediaAsset.id.in_(requested_ids),
            ownership,
            or_(MediaAsset.article_id.is_(None), MediaAsset.article_id == article.id),
        ))).all()
        if len(assets) != len(requested_ids):
            raise HTTPException(422, "One or more media files are unavailable")
        for asset in assets:
            asset.article_id = article.id

    urls = referenced_media_urls(article.content)
    urls.update(url for url in (article.featured_image_url, article.social_image_url) if url)
    if urls:
        query = select(MediaAsset.url).where(MediaAsset.url.in_(urls))
        if user.role != UserRole.ADMIN:
            query = query.where(or_(MediaAsset.uploaded_by_id == user.id, MediaAsset.article_id == article.id))
        found = set((await db.scalars(query)).all())
        if found != urls:
            raise HTTPException(422, "Article references media that is unavailable")


async def create_article(db: AsyncSession, data: ArticleCreate, user: User) -> Article:
    article = Article(
        author_id=user.id,
        title=data.title.strip(),
        slug=await resolve_slug(db, data.slug, data.title),
        excerpt=data.excerpt.strip(),
        content=data.content,
        featured_image_url=data.featured_image_url,
        social_image_url=data.social_image_url,
        seo_title=data.seo_title.strip() if data.seo_title else None,
        meta_description=data.meta_description.strip() if data.meta_description else None,
        category=await resolve_category(db, data.category_id),
        tags=await resolve_tags(db, data.tag_ids),
        status=ArticleStatus.DRAFT,
    )
    db.add(article)
    await db.flush()
    await attach_and_validate_media(db, article, user, data.media_ids)
    await db.commit()
    return await get_article(db, article.id)


async def update_article(db: AsyncSession, article_id: uuid.UUID, data: ArticleUpdate, user: User) -> Article:
    article = await get_article(db, article_id)
    fields = data.model_fields_set
    if "title" in fields and data.title is not None:
        article.title = data.title.strip()
    if "slug" in fields:
        article.slug = await resolve_slug(db, data.slug, article.title, article.id)
    if "excerpt" in fields:
        article.excerpt = (data.excerpt or "").strip()
    if "content" in fields and data.content is not None:
        article.content = data.content
    if "featured_image_url" in fields:
        article.featured_image_url = data.featured_image_url
    if "social_image_url" in fields:
        article.social_image_url = data.social_image_url
    if "seo_title" in fields:
        article.seo_title = data.seo_title.strip() if data.seo_title else None
    if "meta_description" in fields:
        article.meta_description = data.meta_description.strip() if data.meta_description else None
    if "category_id" in fields:
        article.category = await resolve_category(db, data.category_id)
    if "tag_ids" in fields and data.tag_ids is not None:
        article.tags = await resolve_tags(db, data.tag_ids)
    await attach_and_validate_media(db, article, user, data.media_ids or [])
    await db.commit()
    return await get_article(db, article.id)


async def publish_article(db: AsyncSession, article_id: uuid.UUID, user: User) -> Article:
    article = await get_article(db, article_id)
    if not article.title.strip() or not article.slug.strip() or not has_publishable_content(article.content):
        raise HTTPException(422, "Title, slug, and article content are required before publishing")
    await attach_and_validate_media(db, article, user, [])
    article.status = ArticleStatus.PUBLISHED
    article.published_at = datetime.now(timezone.utc)
    article.scheduled_at = None
    await db.commit()
    return await get_article(db, article.id)


async def unpublish_article(db: AsyncSession, article_id: uuid.UUID) -> Article:
    article = await get_article(db, article_id)
    article.status = ArticleStatus.DRAFT
    article.published_at = None
    article.scheduled_at = None
    await db.commit()
    return await get_article(db, article.id)


async def schedule_article(db: AsyncSession, article_id: uuid.UUID, scheduled_at: datetime, user: User) -> Article:
    article = await get_article(db, article_id)
    scheduled_utc = scheduled_at.astimezone(timezone.utc)
    if scheduled_utc <= datetime.now(timezone.utc):
        raise HTTPException(422, "Scheduled publication time must be in the future")
    if not article.title.strip() or not article.slug.strip() or not has_publishable_content(article.content):
        raise HTTPException(422, "Title, slug, and article content are required before scheduling")
    await attach_and_validate_media(db, article, user, [])
    article.status = ArticleStatus.SCHEDULED
    article.scheduled_at = scheduled_utc
    article.published_at = None
    await db.commit()
    return await get_article(db, article.id)


async def publish_due_articles(db: AsyncSession) -> None:
    now = datetime.now(timezone.utc)
    result = await db.execute(
        update(Article)
        .where(Article.status == ArticleStatus.SCHEDULED, Article.scheduled_at <= now)
        .values(status=ArticleStatus.PUBLISHED, published_at=Article.scheduled_at, scheduled_at=None)
    )
    if result.rowcount:
        await db.commit()
