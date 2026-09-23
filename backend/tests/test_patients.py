import asyncio
import uuid
from types import SimpleNamespace

from fastapi.testclient import TestClient
from fastapi import HTTPException
import pytest
from pydantic import ValidationError

from app.dependencies import get_current_user
from app.main import app
from app.models import UserRole
from app.routers.patients import normalize_iranian_mobile, update_patient_additional_notes
from app.schemas import PatientAdditionalNotesUpdate, PatientCreateRequest


def test_patient_creation_requires_staff_authentication() -> None:
    response = TestClient(app).post(
        "/api/v1/patients",
        json={
            "full_name": "Test Patient",
            "email": "patient@example.com",
            "phone": "09123456789",
            "password": "a-secure-password",
        },
    )
    assert response.status_code == 401


def test_iranian_mobile_numbers_are_normalized() -> None:
    assert normalize_iranian_mobile("+98 912-345-6789") == "09123456789"
    assert normalize_iranian_mobile("۰۹۱۲۳۴۵۶۷۸۹") == "09123456789"


def test_invalid_iranian_mobile_number_is_rejected() -> None:
    with pytest.raises(HTTPException):
        normalize_iranian_mobile("02112345678")


def test_patient_additional_notes_are_optional() -> None:
    patient = PatientCreateRequest(
        full_name="Test Patient",
        email="patient@example.com",
        phone="09123456789",
        password="a-secure-password",
    )
    assert patient.additional_notes == ""


def test_patient_additional_notes_length_is_limited() -> None:
    with pytest.raises(ValidationError):
        PatientCreateRequest(
            full_name="Test Patient",
            email="patient@example.com",
            phone="09123456789",
            password="a-secure-password",
            additional_notes="ن" * 2001,
        )


def test_patient_notes_update_requires_staff_authentication() -> None:
    response = TestClient(app).patch(
        "/api/v1/patients/00000000-0000-0000-0000-000000000001/additional-notes",
        json={"additional_notes": "Follow-up notes"},
    )
    assert response.status_code == 401


def test_regular_user_cannot_update_patient_notes() -> None:
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(role=UserRole.USER)
    try:
        response = TestClient(app).patch(
            "/api/v1/patients/00000000-0000-0000-0000-000000000001/additional-notes",
            json={"additional_notes": "Follow-up notes"},
        )
        assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


def test_patient_notes_update_length_is_limited() -> None:
    with pytest.raises(ValidationError):
        PatientAdditionalNotesUpdate(additional_notes="ن" * 2001)


def test_patient_notes_are_trimmed_before_saving() -> None:
    patient = SimpleNamespace(additional_notes="Old notes")

    class FakeSession:
        committed = False
        refreshed = None

        async def scalar(self, _query):
            return patient

        async def commit(self):
            self.committed = True

        async def refresh(self, value):
            self.refreshed = value

    db = FakeSession()
    result = asyncio.run(
        update_patient_additional_notes(
            patient_id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
            data=PatientAdditionalNotesUpdate(additional_notes="  Follow-up notes  "),
            _staff=SimpleNamespace(role=UserRole.DOCTOR),
            db=db,
        )
    )

    assert result is patient
    assert patient.additional_notes == "Follow-up notes"
    assert db.committed is True
    assert db.refreshed is patient
