import uuid
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import require_roles
from app.models import User, UserRole
from app.schemas import AdminUserCreate, RoleUpdate, UserNameUpdate, UserResponse
from app.security import hash_password

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_roles(UserRole.ADMIN))])

@router.get("/users", response_model=list[UserResponse])
async def list_users(db: AsyncSession = Depends(get_db)):
    return (await db.scalars(select(User).where(User.is_active.is_(True)).order_by(User.created_at.desc()))).all()


@router.post("/users", response_model=UserResponse, status_code=201)
async def create_user(data: AdminUserCreate, db: AsyncSession = Depends(get_db)):
    user = User(email=data.email.lower(), phone=data.phone.strip() if data.phone else None, full_name=data.full_name.strip(), hashed_password=hash_password(data.password), role=data.role)
    db.add(user)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="An account with this email or phone already exists")
    await db.refresh(user)
    return user

@router.patch("/users/{user_id}/role", response_model=UserResponse)
async def update_role(user_id: uuid.UUID, data: RoleUpdate, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_superuser and data.role != UserRole.ADMIN:
        raise HTTPException(status_code=409, detail="The main manager role cannot be changed")
    user.role = data.role
    await db.commit()
    await db.refresh(user)
    return user


@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user_name(user_id: uuid.UUID, data: UserNameUpdate, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.full_name = data.full_name
    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_user(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_superuser:
        raise HTTPException(status_code=409, detail="The main manager account cannot be removed")
    user.is_active = False
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
