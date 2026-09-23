"""add follow-up notes to contact requests

Revision ID: 0009
Revises: 0008
"""

from alembic import op
import sqlalchemy as sa


revision = "0009"
down_revision = "0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("contact_requests", sa.Column("follow_up_notes", sa.Text(), nullable=False, server_default=""))


def downgrade() -> None:
    op.drop_column("contact_requests", "follow_up_notes")
