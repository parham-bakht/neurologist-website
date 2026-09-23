from fastapi.testclient import TestClient

from app.main import app


def test_patient_visit_history_requires_authentication() -> None:
    response = TestClient(app).get("/api/v1/visits/my")
    assert response.status_code == 401


def test_staff_visit_index_requires_authentication() -> None:
    response = TestClient(app).get("/api/v1/visits", params={"patient_name": "Ali", "visit_on": "2026-09-08", "sort": "asc"})
    assert response.status_code == 401


def test_creating_visit_requires_staff_authentication() -> None:
    response = TestClient(app).post(
        "/api/v1/patients/00000000-0000-0000-0000-000000000000/visits",
        json={
            "scheduled_at": "2026-09-10T10:00:00+03:30",
            "status": "scheduled",
            "description": "",
            "medications": "",
        },
    )
    assert response.status_code == 401


def test_editing_visit_requires_staff_authentication() -> None:
    response = TestClient(app).put(
        "/api/v1/visits/00000000-0000-0000-0000-000000000000",
        json={
            "scheduled_at": "2026-09-10T10:00:00+03:30",
            "status": "completed",
            "description": "Updated visit notes",
            "medications": "Updated prescription",
        },
    )
    assert response.status_code == 401
