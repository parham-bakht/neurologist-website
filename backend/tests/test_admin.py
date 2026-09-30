import asyncio
import uuid
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.main import app
from app.models import UserRole
from app.routers.admin import remove_user, update_role, update_user_name
from app.routers.auth import update_my_name
from app.schemas import AdminUserCreate, RoleUpdate, UserNameUpdate


def test_user_management_requires_admin_authentication() -> None:
    response = TestClient(app).get("/api/v1/admin/users")
    assert response.status_code == 401


def test_removing_user_requires_admin_authentication() -> None:
    response = TestClient(app).delete("/api/v1/admin/users/00000000-0000-0000-0000-000000000000")
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


def test_user_name_update_trims_whitespace() -> None:
    update = UserNameUpdate(full_name="  Doctor Name  ")
    assert update.full_name == "Doctor Name"


def test_admin_can_update_a_user_name() -> None:
    user = SimpleNamespace(
        id=uuid.UUID("00000000-0000-0000-0000-000000000002"),
        full_name="Old Name",
    )

    class FakeSession:
        committed = False

        async def get(self, _model, _user_id):
            return user

        async def commit(self):
            self.committed = True

        async def refresh(self, _user):
            return None

    session = FakeSession()
    result = asyncio.run(update_user_name(user.id, UserNameUpdate(full_name="New Name"), session))
    assert result.full_name == "New Name"
    assert session.committed is True


def test_updating_own_name_requires_authentication() -> None:
    response = TestClient(app).patch("/api/v1/auth/me", json={"full_name": "New Name"})
    assert response.status_code == 401


@pytest.mark.parametrize("role", [UserRole.DOCTOR, UserRole.ADMIN])
def test_staff_can_update_their_own_name(role: UserRole) -> None:
    user = SimpleNamespace(role=role, full_name="Old Name")

    class FakeSession:
        committed = False

        async def commit(self):
            self.committed = True

        async def refresh(self, _user):
            return None

    session = FakeSession()
    result = asyncio.run(update_my_name(UserNameUpdate(full_name="New Name"), user, session))
    assert result.full_name == "New Name"
    assert session.committed is True


def test_patient_cannot_use_staff_name_editor() -> None:
    patient = SimpleNamespace(role=UserRole.USER, full_name="Patient Name")
    with pytest.raises(HTTPException) as error:
        asyncio.run(update_my_name(UserNameUpdate(full_name="New Name"), patient, SimpleNamespace()))
    assert error.value.status_code == 403


def test_removing_user_deactivates_instead_of_deleting() -> None:
    user = SimpleNamespace(
        id=uuid.UUID("00000000-0000-0000-0000-000000000003"),
        is_active=True,
        is_superuser=False,
    )

    class FakeSession:
        committed = False

        async def get(self, _model, _user_id):
            return user

        async def commit(self):
            self.committed = True

    session = FakeSession()
    response = asyncio.run(remove_user(user.id, session))
    assert response.status_code == 204
    assert user.is_active is False
    assert session.committed is True


def test_main_manager_cannot_be_removed() -> None:
    manager = SimpleNamespace(
        id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
        is_active=True,
        is_superuser=True,
    )

    class FakeSession:
        async def get(self, _model, _user_id):
            return manager

    with pytest.raises(HTTPException) as error:
        asyncio.run(remove_user(manager.id, FakeSession()))
    assert error.value.status_code == 409
