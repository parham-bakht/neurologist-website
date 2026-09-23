"""create articles and media assets"""
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

def upgrade() -> None:
    article_status = sa.Enum("draft", "published", name="articlestatus")
    op.create_table(
        "articles",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("author_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(180), nullable=False),
        sa.Column("slug", sa.String(200), nullable=False),
        sa.Column("excerpt", sa.String(320), nullable=False, server_default=""),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("status", article_status, nullable=False, server_default="draft"),
        sa.Column("cover_media_url", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_articles_author_id", "articles", ["author_id"])
    op.create_index("ix_articles_slug", "articles", ["slug"], unique=True)
    op.create_index("ix_articles_status", "articles", ["status"])
    op.create_table(
        "media_assets",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("article_id", sa.Uuid(), sa.ForeignKey("articles.id", ondelete="CASCADE"), nullable=True),
        sa.Column("uploaded_by_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("url", sa.String(500), nullable=False),
        sa.Column("media_type", sa.String(20), nullable=False),
        sa.Column("original_name", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_media_assets_article_id", "media_assets", ["article_id"])
    op.create_index("ix_media_assets_uploaded_by_id", "media_assets", ["uploaded_by_id"])

def downgrade() -> None:
    op.drop_table("media_assets")
    op.drop_table("articles")
    sa.Enum(name="articlestatus").drop(op.get_bind(), checkfirst=True)
