"""create patient visits"""
from alembic import op
import sqlalchemy as sa

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    visit_status = sa.Enum("scheduled", "completed", "cancelled", name="visitstatus")
    op.create_table(
        "visits",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("patient_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("doctor_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", visit_status, nullable=False, server_default="scheduled"),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("medications", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_visits_patient_id", "visits", ["patient_id"])
    op.create_index("ix_visits_doctor_id", "visits", ["doctor_id"])
    op.create_index("ix_visits_scheduled_at", "visits", ["scheduled_at"])
    op.create_index("ix_visits_status", "visits", ["status"])


def downgrade() -> None:
    op.drop_table("visits")
    sa.Enum(name="visitstatus").drop(op.get_bind(), checkfirst=True)
