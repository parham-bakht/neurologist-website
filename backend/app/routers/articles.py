import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_roles
from app.models import Article, ArticleStatus, MediaAsset, User, UserRole
from app.routers.uploads import persist_image, storage
from app.schemas import ArticleCreate, ArticleResponse, ArticleScheduleRequest, ArticleUpdate, ArticleWrite, MediaResponse
from app.services import article_service


router = APIRouter(prefix="/articles", tags=["articles"])
editor_user = require_roles(UserRole.DOCTOR, UserRole.ADMIN)

# Public imports retained for compatibility with existing utility consumers.
slugify = article_service.slugify
article_query = article_service.article_query


@router.get("", response_model=list[ArticleResponse])
async def public_articles(db: AsyncSession = Depends(get_db)):
    await article_service.publish_due_articles(db)
    result = await db.scalars(
        article_service.article_query()
        .where(Article.status == ArticleStatus.PUBLISHED)
        .order_by(Article.published_at.desc())
    )
    return result.all()


@router.get("/manage", response_model=list[ArticleResponse])
async def managed_articles(user: User = Depends(editor_user), db: AsyncSession = Depends(get_db)):
    await article_service.publish_due_articles(db)
    return (await db.scalars(article_service.article_query().order_by(Article.updated_at.desc()))).all()


@router.get("/manage/{article_id}", response_model=ArticleResponse)
async def managed_article(article_id: uuid.UUID, user: User = Depends(editor_user), db: AsyncSession = Depends(get_db)):
    return await article_service.get_article(db, article_id)


@router.post("/upload/media", response_model=MediaResponse, status_code=status.HTTP_201_CREATED)
async def legacy_upload_media(
    file: UploadFile = File(...),
    alt_text: str = Form(default=""),
    caption: str = Form(default=""),
    user: User = Depends(editor_user),
    db: AsyncSession = Depends(get_db),
):
    return await persist_image(file, user, db, alt_text, caption)


@router.delete("/media/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_media(media_id: uuid.UUID, user: User = Depends(editor_user), db: AsyncSession = Depends(get_db)):
    asset = await db.get(MediaAsset, media_id)
    if not asset or (user.role != UserRole.ADMIN and asset.uploaded_by_id != user.id):
        raise HTTPException(404, "Media not found")
    if asset.article_id is not None:
        raise HTTPException(409, "Remove this image from its article before deleting the file")
    storage_key = asset.storage_key
    await db.delete(asset)
    await db.commit()
    storage.delete(storage_key)


@router.post("", response_model=ArticleResponse, status_code=status.HTTP_201_CREATED)
async def create_article(data: ArticleCreate, user: User = Depends(editor_user), db: AsyncSession = Depends(get_db)):
    return await article_service.create_article(db, data, user)


@router.patch("/{article_id}", response_model=ArticleResponse)
async def patch_article(article_id: uuid.UUID, data: ArticleUpdate, user: User = Depends(editor_user), db: AsyncSession = Depends(get_db)):
    return await article_service.update_article(db, article_id, data, user)


@router.put("/{article_id}", response_model=ArticleResponse)
async def replace_article(article_id: uuid.UUID, data: ArticleWrite, user: User = Depends(editor_user), db: AsyncSession = Depends(get_db)):
    updated = await article_service.update_article(
        db,
        article_id,
        ArticleUpdate(**data.model_dump(exclude={"status"})),
        user,
    )
    if data.status == ArticleStatus.PUBLISHED:
        return await article_service.publish_article(db, updated.id, user)
    if updated.status != ArticleStatus.DRAFT:
        return await article_service.unpublish_article(db, updated.id)
    return updated


@router.post("/{article_id}/publish", response_model=ArticleResponse)
async def publish_article(article_id: uuid.UUID, user: User = Depends(editor_user), db: AsyncSession = Depends(get_db)):
    return await article_service.publish_article(db, article_id, user)


@router.post("/{article_id}/unpublish", response_model=ArticleResponse)
async def unpublish_article(article_id: uuid.UUID, user: User = Depends(editor_user), db: AsyncSession = Depends(get_db)):
    return await article_service.unpublish_article(db, article_id)


@router.post("/{article_id}/schedule", response_model=ArticleResponse)
async def schedule_article(article_id: uuid.UUID, data: ArticleScheduleRequest, user: User = Depends(editor_user), db: AsyncSession = Depends(get_db)):
    return await article_service.schedule_article(db, article_id, data.scheduled_at, user)


@router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_article(article_id: uuid.UUID, user: User = Depends(editor_user), db: AsyncSession = Depends(get_db)):
    article = await article_service.get_article(db, article_id)
    await db.delete(article)
    await db.commit()


@router.get("/{slug}", response_model=ArticleResponse)
async def public_article(slug: str, db: AsyncSession = Depends(get_db)):
    await article_service.publish_due_articles(db)
    article = await db.scalar(
        article_service.article_query().where(
            Article.slug == slug,
            Article.status == ArticleStatus.PUBLISHED,
        )
    )
    if not article:
        raise HTTPException(404, "Article not found")
    return article
