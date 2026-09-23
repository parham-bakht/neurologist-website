"""create users table"""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    role = sa.Enum("user", "doctor", "admin", name="userrole")
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("full_name", sa.String(120), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("role", role, nullable=False, server_default="user"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

def downgrade() -> None:
    op.drop_table("users")
    sa.Enum(name="userrole").drop(op.get_bind(), checkfirst=True)
