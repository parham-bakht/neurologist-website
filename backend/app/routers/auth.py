from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.schemas import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register", response_model=UserResponse, status_code=201)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    user = User(email=data.email.lower(), full_name=data.full_name.strip(), hashed_password=hash_password(data.password))
    db.add(user)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    await db.refresh(user)
    return user

@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == data.email.lower()))
    if not user or not user.is_active or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    return TokenResponse(access_token=create_access_token(str(user.id)))

@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(get_current_user)):
    return user

