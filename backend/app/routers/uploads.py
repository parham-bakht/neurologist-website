from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_roles
from app.models import MediaAsset, User, UserRole
from app.schemas import MediaResponse
from app.services.media_storage import InvalidImage, InvalidVideo, LocalArticleImageStorage, LocalArticleVideoStorage, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES


router = APIRouter(prefix="/uploads", tags=["uploads"])
storage = LocalArticleImageStorage(Path(__file__).resolve().parents[2] / "uploads")
video_storage = LocalArticleVideoStorage(Path(__file__).resolve().parents[2] / "uploads")


async def persist_image(
    file: UploadFile,
    user: User,
    db: AsyncSession,
    alt_text: str = "",
    caption: str = "",
) -> MediaAsset:
    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Use a JPEG, PNG, or WebP image")
    if len(alt_text) > 300 or len(caption) > 500:
        raise HTTPException(422, "Image alternative text or caption is too long")
    content = await file.read(MAX_IMAGE_BYTES + 1)
    try:
        stored = storage.save(content)
    except InvalidImage as exc:
        message = str(exc)
        code = status.HTTP_413_REQUEST_ENTITY_TOO_LARGE if "10 MB" in message else status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
        raise HTTPException(code, message) from exc
    if file.content_type != stored.mime_type:
        storage.delete(stored.storage_key)
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "The file content does not match its declared image type")

    asset = MediaAsset(
        uploaded_by_id=user.id,
        url=stored.url,
        storage_key=stored.storage_key,
        media_type="image",
        mime_type=stored.mime_type,
        original_name=(file.filename or "image")[:255],
        alt_text=alt_text.strip(),
        caption=caption.strip(),
        width=stored.width,
        height=stored.height,
        file_size=stored.file_size,
    )
    db.add(asset)
    try:
        await db.commit()
    except Exception:
        await db.rollback()
        storage.delete(stored.storage_key)
        raise
    await db.refresh(asset)
    return asset


async def persist_video(
    file: UploadFile,
    user: User,
    db: AsyncSession,
    caption: str = "",
) -> MediaAsset:
    if file.content_type not in {"video/mp4", "video/webm"}:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Use an MP4 or WebM video")
    if len(caption) > 500:
        raise HTTPException(422, "Video caption is too long")
    content = await file.read(MAX_VIDEO_BYTES + 1)
    try:
        stored = video_storage.save(content)
    except InvalidVideo as exc:
        code = status.HTTP_413_REQUEST_ENTITY_TOO_LARGE if "100 MB" in str(exc) else status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
        raise HTTPException(code, str(exc)) from exc
    if file.content_type != stored.mime_type:
        video_storage.delete(stored.storage_key)
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "The file content does not match its declared video type")

    asset = MediaAsset(uploaded_by_id=user.id, url=stored.url, storage_key=stored.storage_key, media_type="video", mime_type=stored.mime_type, original_name=(file.filename or "video")[:255], alt_text="", caption=caption.strip(), width=None, height=None, file_size=stored.file_size)
    db.add(asset)
    try:
        await db.commit()
    except Exception:
        await db.rollback()
        video_storage.delete(stored.storage_key)
        raise
    await db.refresh(asset)
    return asset


@router.post("/images", response_model=MediaResponse, status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(...),
    alt_text: str = Form(default=""),
    caption: str = Form(default=""),
    user: User = Depends(require_roles(UserRole.DOCTOR, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    return await persist_image(file, user, db, alt_text, caption)


@router.post("/videos", response_model=MediaResponse, status_code=status.HTTP_201_CREATED)
async def upload_video(
    file: UploadFile = File(...),
    caption: str = Form(default=""),
    user: User = Depends(require_roles(UserRole.DOCTOR, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    return await persist_video(file, user, db, caption)
