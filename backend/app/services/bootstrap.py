from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.config import settings
from app.database import SessionLocal
from app.models import User, UserRole
from app.security import hash_password


async def ensure_main_manager() -> bool:
    """Create the configured main manager once; never overwrite an existing account."""
    email = settings.main_manager_email.strip().lower()
    if not email or not settings.main_manager_password:
        return False
    async with SessionLocal() as db:
        if await db.scalar(select(User.id).where(User.email == email)) is not None:
            return False
        db.add(User(email=email, full_name=settings.main_manager_name.strip(), hashed_password=hash_password(settings.main_manager_password), role=UserRole.ADMIN, is_superuser=True, is_active=True))
        try:
            await db.commit()
        except IntegrityError:
            await db.rollback()
            return False
        return True
