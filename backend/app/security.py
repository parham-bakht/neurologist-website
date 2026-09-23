from datetime import datetime, timedelta, timezone
import jwt
from pwdlib import PasswordHash
from app.config import settings

password_hash = PasswordHash.recommended()

def hash_password(password: str) -> str:
    return password_hash.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return password_hash.verify(password, hashed)

def create_access_token(subject: str) -> str:
    expires = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode({"sub": subject, "exp": expires, "type": "access"}, settings.jwt_secret, algorithm="HS256")

def decode_access_token(token: str) -> str:
    payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    if payload.get("type") != "access" or not payload.get("sub"):
        raise jwt.InvalidTokenError("Invalid token")
    return payload["sub"]

