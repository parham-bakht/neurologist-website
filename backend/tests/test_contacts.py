from fastapi.testclient import TestClient
from pydantic import ValidationError
import pytest

from app.main import app
from app.models import ContactStatus
from app.schemas import ContactStatusUpdate


def test_contact_inbox_requires_staff_authentication() -> None:
    response = TestClient(app).get("/api/v1/contact-requests")
    assert response.status_code == 401


def test_contact_form_validates_phone_number() -> None:
    response = TestClient(app).post(
        "/api/v1/contact-requests",
        json={"full_name": "Test Patient", "phone": "not-a-phone", "description": "Please contact me"},
    )
    assert response.status_code == 422


def test_contact_inbox_filters_require_staff_authentication() -> None:
    response = TestClient(app).get(
        "/api/v1/contact-requests",
        params={"name": "Patient", "phone": "0912", "submitted_on": "2026-09-02"},
    )
    assert response.status_code == 401


def test_follow_up_notes_are_accepted() -> None:
    update = ContactStatusUpdate(status=ContactStatus.CONTACTED, follow_up_notes="تماس برقرار شد و زمان مراجعه توضیح داده شد.")
    assert update.follow_up_notes.startswith("تماس")


def test_follow_up_notes_length_is_limited() -> None:
    with pytest.raises(ValidationError):
        ContactStatusUpdate(status=ContactStatus.CONTACTED, follow_up_notes="x" * 2001)
