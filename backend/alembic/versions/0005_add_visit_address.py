"""add visit address"""
from alembic import op
import sqlalchemy as sa

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("visits", sa.Column("address", sa.String(500), nullable=False, server_default=""))


def downgrade() -> None:
    op.drop_column("visits", "address")
