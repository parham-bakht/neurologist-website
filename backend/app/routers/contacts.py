import uuid
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_roles
from app.models import ContactRequest, ContactStatus, User, UserRole
from app.schemas import ContactRequestCreate, ContactRequestResponse, ContactStatusUpdate

router = APIRouter(prefix="/contact-requests", tags=["contact requests"])

@router.post("", response_model=ContactRequestResponse, status_code=201)
async def create_contact_request(data: ContactRequestCreate, db: AsyncSession = Depends(get_db)):
    request = ContactRequest(full_name=data.full_name.strip(), phone=data.phone.strip(), description=data.description.strip())
    db.add(request)
    await db.commit()
    await db.refresh(request)
    return request

@router.get("", response_model=list[ContactRequestResponse])
async def list_contact_requests(
    name: str | None = Query(default=None, max_length=120),
    phone: str | None = Query(default=None, max_length=30),
    submitted_on: date | None = None,
    _user: User = Depends(require_roles(UserRole.DOCTOR, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    query = select(ContactRequest)
    if name and (value := name.strip()):
        query = query.where(ContactRequest.full_name.ilike(f"%{value}%"))
    if phone and (value := phone.strip()):
        query = query.where(ContactRequest.phone.ilike(f"%{value}%"))
    if submitted_on:
        query = query.where(func.date(ContactRequest.created_at) == submitted_on)
    return (await db.scalars(query.order_by(ContactRequest.created_at.desc()))).all()

@router.patch("/{request_id}", response_model=ContactRequestResponse)
async def update_contact_request(request_id: uuid.UUID, data: ContactStatusUpdate, _user: User = Depends(require_roles(UserRole.DOCTOR, UserRole.ADMIN)), db: AsyncSession = Depends(get_db)):
    request = await db.get(ContactRequest, request_id)
    if not request:
        raise HTTPException(404, "Contact request not found")
    request.status = data.status
    request.follow_up_notes = data.follow_up_notes.strip()
    request.contacted_at = datetime.now(timezone.utc) if data.status == ContactStatus.CONTACTED else None
    await db.commit()
    await db.refresh(request)
    return request
