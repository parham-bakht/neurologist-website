import asyncio
import sys
from sqlalchemy import select
from app.database import SessionLocal
from app.models import User, UserRole
from app.security import hash_password

async def create_admin(email: str, password: str) -> None:
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters")
    async with SessionLocal() as db:
        user = await db.scalar(select(User).where(User.email == email.lower()))
        if user:
            user.role = UserRole.ADMIN
            user.hashed_password = hash_password(password)
        else:
            db.add(User(email=email.lower(), full_name="Administrator", hashed_password=hash_password(password), role=UserRole.ADMIN))
        await db.commit()
    print(f"Admin account ready: {email.lower()}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: python -m app.create_admin EMAIL PASSWORD")
    asyncio.run(create_admin(sys.argv[1], sys.argv[2]))

