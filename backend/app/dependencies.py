import uuid
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models import User, UserRole
from app.security import decode_access_token

bearer = HTTPBearer(auto_error=False)

async def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer), db: AsyncSession = Depends(get_db)) -> User:
    unauthorized = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing credentials", headers={"WWW-Authenticate": "Bearer"})
    if not credentials:
        raise unauthorized
    try:
        user_id = uuid.UUID(decode_access_token(credentials.credentials))
    except (jwt.InvalidTokenError, ValueError):
        raise unauthorized
    user = await db.get(User, user_id)
    if not user or not user.is_active:
        raise unauthorized
    return user

def require_roles(*roles: UserRole):
    async def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return dependency

