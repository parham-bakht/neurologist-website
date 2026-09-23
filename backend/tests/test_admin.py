import asyncio
import uuid
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.main import app
from app.models import UserRole
from app.routers.admin import update_role
from app.schemas import AdminUserCreate, RoleUpdate


def test_user_management_requires_admin_authentication() -> None:
    response = TestClient(app).get("/api/v1/admin/users")
    assert response.status_code == 401


def test_admin_can_prepare_doctor_account() -> None:
    account = AdminUserCreate(
        full_name="Test Doctor",
        email="doctor@example.com",
        phone="09123456789",
        password="a-secure-password",
        role=UserRole.DOCTOR,
    )
    assert account.role == UserRole.DOCTOR
    assert account.phone == "09123456789"


def test_main_manager_cannot_be_demoted() -> None:
    manager = SimpleNamespace(
        id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
        role=UserRole.ADMIN,
        is_superuser=True,
    )

    class FakeSession:
        async def get(self, _model, _user_id):
            return manager

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            update_role(
                manager.id,
                RoleUpdate(role=UserRole.USER),
                FakeSession(),
            )
        )
    assert error.value.status_code == 409
