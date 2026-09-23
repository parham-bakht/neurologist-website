import uuid
import re
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import require_roles
from app.models import User, UserRole, Visit, VisitStatus
from app.schemas import (
    PatientAdditionalNotesUpdate,
    PatientCreateRequest,
    PatientDetailResponse,
    PatientListResponse,
    PatientResponse,
    UserResponse,
)
from app.security import hash_password

router = APIRouter(prefix="/patients", tags=["patients"])


def normalize_iranian_mobile(value: str) -> str:
    translation = str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789")
    phone = re.sub(r"[\s()\-]", "", value.translate(translation))
    if phone.startswith("+98"):
        phone = "0" + phone[3:]
    elif phone.startswith("0098"):
        phone = "0" + phone[4:]
    elif phone.startswith("98"):
        phone = "0" + phone[2:]
    if not re.fullmatch(r"09\d{9}", phone):
        raise HTTPException(422, "Enter a valid Iranian mobile number")
    return phone


@router.get("", response_model=list[PatientListResponse])
async def list_patients(
    name: str | None = Query(default=None, max_length=120),
    _staff: User = Depends(require_roles(UserRole.DOCTOR, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    query = select(User).where(User.role == UserRole.USER)
    if name and (value := name.strip()):
        query = query.where(User.full_name.ilike(f"%{value}%"))
    patients = list((await db.scalars(query.order_by(User.full_name))).all())
    if not patients:
        return []

    now = datetime.now(timezone.utc)
    visits_query = (
        select(Visit)
        .where(
            Visit.patient_id.in_([patient.id for patient in patients]),
            or_(
                and_(Visit.status == VisitStatus.SCHEDULED, Visit.scheduled_at >= now),
                Visit.status == VisitStatus.COMPLETED,
            ),
        )
        .options(selectinload(Visit.doctor))
        .order_by(Visit.scheduled_at.desc())
    )
    relevant_visits = list((await db.scalars(visits_query)).all())
    next_visits: dict[uuid.UUID, Visit] = {}
    completed_visits: dict[uuid.UUID, Visit] = {}
    for visit in relevant_visits:
        if visit.status == VisitStatus.SCHEDULED:
            current = next_visits.get(visit.patient_id)
            if current is None or visit.scheduled_at < current.scheduled_at:
                next_visits[visit.patient_id] = visit
        elif visit.patient_id not in completed_visits:
            completed_visits[visit.patient_id] = visit

    return [
        {
            **UserResponse.model_validate(patient).model_dump(),
            "next_visit": next_visits.get(patient.id),
            "latest_completed_visit": completed_visits.get(patient.id),
        }
        for patient in patients
    ]


@router.get("/{patient_id}", response_model=PatientDetailResponse)
async def get_patient(
    patient_id: uuid.UUID,
    _staff: User = Depends(require_roles(UserRole.DOCTOR, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    query = select(User).where(User.id == patient_id, User.role == UserRole.USER)
    patient = await db.scalar(query)
    if not patient:
        raise HTTPException(404, "Patient not found")
    visits_query = (
        select(Visit)
        .where(Visit.patient_id == patient.id)
        .options(selectinload(Visit.doctor), selectinload(Visit.patient))
        .order_by(Visit.scheduled_at.desc())
    )
    visits = (await db.scalars(visits_query)).all()
    return {
        **PatientResponse.model_validate(patient).model_dump(),
        "visits": visits,
    }


@router.patch("/{patient_id}/additional-notes", response_model=PatientResponse)
async def update_patient_additional_notes(
    patient_id: uuid.UUID,
    data: PatientAdditionalNotesUpdate,
    _staff: User = Depends(require_roles(UserRole.DOCTOR, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    query = select(User).where(User.id == patient_id, User.role == UserRole.USER)
    patient = await db.scalar(query)
    if not patient:
        raise HTTPException(404, "Patient not found")
    patient.additional_notes = data.additional_notes.strip()
    await db.commit()
    await db.refresh(patient)
    return patient


@router.post("", response_model=UserResponse, status_code=201)
async def create_patient(
    data: PatientCreateRequest,
    _staff: User = Depends(require_roles(UserRole.DOCTOR, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    phone = normalize_iranian_mobile(data.phone)
    existing_email = await db.scalar(select(User.id).where(User.email == data.email.lower()))
    if existing_email:
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    existing_phone = await db.scalar(select(User.id).where(User.phone == phone))
    if existing_phone:
        raise HTTPException(status_code=409, detail="An account with this mobile number already exists")
    patient = User(
        email=data.email.lower(),
        phone=phone,
        full_name=data.full_name.strip(),
        additional_notes=data.additional_notes.strip(),
        hashed_password=hash_password(data.password),
        role=UserRole.USER,
    )
    db.add(patient)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="An account with this email or mobile number already exists")
    await db.refresh(patient)
    return patient
