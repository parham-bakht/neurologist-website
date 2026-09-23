from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_roles
from app.models import Category, Tag, User, UserRole
from app.schemas import CategoryResponse, TagCreate, TagResponse
from app.services.article_service import slugify


router = APIRouter(tags=["article taxonomies"])


@router.get("/categories", response_model=list[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    return (await db.scalars(select(Category).order_by(Category.name))).all()


@router.get("/tags", response_model=list[TagResponse])
async def list_tags(search: str = Query(default="", max_length=60), db: AsyncSession = Depends(get_db)):
    query = select(Tag).order_by(Tag.name).limit(100)
    if search.strip():
        query = query.where(func.lower(Tag.name).contains(search.strip().lower()))
    return (await db.scalars(query)).all()


@router.post("/tags", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
async def create_tag(
    data: TagCreate,
    user: User = Depends(require_roles(UserRole.DOCTOR, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    name = " ".join(data.name.split())
    existing = await db.scalar(select(Tag).where(func.lower(Tag.name) == name.lower()))
    if existing:
        return existing
    tag = Tag(name=name, slug=slugify(name))
    db.add(tag)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(409, "A tag with this name or slug already exists") from exc
    await db.refresh(tag)
    return tag
