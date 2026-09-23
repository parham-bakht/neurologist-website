import uuid
from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models import User, UserRole, Visit
from app.schemas import VisitResponse, VisitWrite

router = APIRouter(tags=["visits"])


def normalize_visit(data: VisitWrite) -> dict:
    scheduled_at = data.scheduled_at
    if scheduled_at.tzinfo is None:
        scheduled_at = scheduled_at.replace(tzinfo=timezone.utc)
    return {
        "scheduled_at": scheduled_at,
        "status": data.status,
        "description": data.description.strip(),
        "medications": data.medications.strip(),
        "address": data.address.strip(),
    }


@router.get("/visits/my", response_model=list[VisitResponse])
async def my_visits(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role != UserRole.USER:
        raise HTTPException(403, "This endpoint is for patient accounts")
    query = (
        select(Visit)
        .where(Visit.patient_id == user.id)
        .options(selectinload(Visit.doctor), selectinload(Visit.patient))
        .order_by(Visit.scheduled_at.desc())
    )
    return (await db.scalars(query)).all()


@router.get("/visits", response_model=list[VisitResponse])
async def list_visits(
    patient_name: str | None = Query(default=None, max_length=120),
    visit_on: date | None = None,
    sort: str = Query(default="desc", pattern="^(asc|desc)$"),
    _staff: User = Depends(require_roles(UserRole.DOCTOR, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    query = select(Visit).join(User, Visit.patient_id == User.id)
    if patient_name and (value := patient_name.strip()):
        query = query.where(User.full_name.ilike(f"%{value}%"))
    if visit_on:
        tehran = ZoneInfo("Asia/Tehran")
        start = datetime.combine(visit_on, time.min, tzinfo=tehran).astimezone(timezone.utc)
        end = (datetime.combine(visit_on, time.min, tzinfo=tehran) + timedelta(days=1)).astimezone(timezone.utc)
        query = query.where(Visit.scheduled_at >= start, Visit.scheduled_at < end)
    ordering = Visit.scheduled_at.asc() if sort == "asc" else Visit.scheduled_at.desc()
    query = query.options(selectinload(Visit.doctor), selectinload(Visit.patient)).order_by(ordering)
    return (await db.scalars(query)).all()


@router.post("/patients/{patient_id}/visits", response_model=VisitResponse, status_code=201)
async def create_visit(
    patient_id: uuid.UUID,
    data: VisitWrite,
    staff: User = Depends(require_roles(UserRole.DOCTOR, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    patient = await db.get(User, patient_id)
    if not patient or patient.role != UserRole.USER:
        raise HTTPException(404, "Patient not found")
    visit = Visit(patient_id=patient.id, doctor_id=staff.id, **normalize_visit(data))
    db.add(visit)
    await db.commit()
    query = select(Visit).where(Visit.id == visit.id).options(selectinload(Visit.doctor), selectinload(Visit.patient))
    return await db.scalar(query)


@router.put("/visits/{visit_id}", response_model=VisitResponse)
async def update_visit(
    visit_id: uuid.UUID,
    data: VisitWrite,
    _staff: User = Depends(require_roles(UserRole.DOCTOR, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    visit = await db.get(Visit, visit_id)
    if not visit:
        raise HTTPException(404, "Visit not found")
    for field, value in normalize_visit(data).items():
        setattr(visit, field, value)
    await db.commit()
    query = select(Visit).where(Visit.id == visit.id).options(selectinload(Visit.doctor), selectinload(Visit.patient))
    return await db.scalar(query)
