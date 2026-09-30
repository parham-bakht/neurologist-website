"""preserve visit doctor when account is deleted

Revision ID: 0011
Revises: 0010
"""

from alembic import op
import sqlalchemy as sa


revision = "0011"
down_revision = "0010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("visits", sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.create_index("ix_visits_is_deleted", "visits", ["is_deleted"])
    op.add_column("visits", sa.Column("doctor_name", sa.String(length=120), nullable=False, server_default=""))
    op.execute(
        sa.text(
            "UPDATE visits SET doctor_name = users.full_name "
            "FROM users WHERE visits.doctor_id = users.id"
        )
    )
    op.alter_column("visits", "doctor_id", existing_type=sa.Uuid(), nullable=True)
    op.drop_constraint("visits_doctor_id_fkey", "visits", type_="foreignkey")
    op.create_foreign_key(
        "visits_doctor_id_fkey",
        "visits",
        "users",
        ["doctor_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    if op.get_bind().execute(sa.text("SELECT 1 FROM visits WHERE doctor_id IS NULL LIMIT 1")).first():
        raise RuntimeError("Cannot downgrade while visits reference deleted doctor accounts")
    op.drop_constraint("visits_doctor_id_fkey", "visits", type_="foreignkey")
    op.create_foreign_key(
        "visits_doctor_id_fkey",
        "visits",
        "users",
        ["doctor_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.alter_column("visits", "doctor_id", existing_type=sa.Uuid(), nullable=False)
    op.drop_column("visits", "doctor_name")
    op.drop_index("ix_visits_is_deleted", table_name="visits")
    op.drop_column("visits", "is_deleted")
