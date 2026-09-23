"""create contact requests"""
from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None

def upgrade() -> None:
    contact_status = sa.Enum("new", "contacted", name="contactstatus")
    op.create_table(
        "contact_requests",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("full_name", sa.String(120), nullable=False),
        sa.Column("phone", sa.String(30), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("status", contact_status, nullable=False, server_default="new"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("contacted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_contact_requests_phone", "contact_requests", ["phone"])
    op.create_index("ix_contact_requests_status", "contact_requests", ["status"])

def downgrade() -> None:
    op.drop_table("contact_requests")
    sa.Enum(name="contactstatus").drop(op.get_bind(), checkfirst=True)
