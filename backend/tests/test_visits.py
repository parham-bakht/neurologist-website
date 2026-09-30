import asyncio
import uuid
from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.dependencies import get_current_user
from app.main import app
from app.models import UserRole
from app.routers.visits import remove_visit


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


def test_removing_visit_requires_staff_authentication() -> None:
    response = TestClient(app).delete("/api/v1/visits/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 401


def test_patient_cannot_remove_visit() -> None:
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(role=UserRole.USER)
    try:
        response = TestClient(app).delete("/api/v1/visits/00000000-0000-0000-0000-000000000000")
        assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


def test_removing_visit_marks_it_deleted_without_erasing_it() -> None:
    visit = SimpleNamespace(
        id=uuid.UUID("00000000-0000-0000-0000-000000000004"),
        is_deleted=False,
    )

    class FakeSession:
        committed = False

        async def scalar(self, _query):
            return visit

        async def commit(self):
            self.committed = True

    session = FakeSession()
    response = asyncio.run(remove_visit(visit.id, SimpleNamespace(), session))
    assert response.status_code == 204
    assert visit.is_deleted is True
    assert session.committed is True
