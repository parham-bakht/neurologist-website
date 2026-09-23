"""expand article publishing system

Revision ID: 0008
Revises: 0007
"""

import json
import re
import uuid

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None


def _legacy_content_document(content: str, media_urls: dict[str, str]) -> dict:
    media_pattern = re.compile(r"\{\{media:([0-9a-f-]{36})\}\}", re.IGNORECASE)
    nodes: list[dict] = []
    for part in media_pattern.split(content or ""):
        if not part:
            continue
        if re.fullmatch(r"[0-9a-f-]{36}", part, re.IGNORECASE):
            url = media_urls.get(part.lower())
            if url and url.lower().endswith((".jpg", ".jpeg", ".png", ".webp", ".gif")):
                nodes.append({"type": "articleImage", "attrs": {"src": url, "alt": "", "caption": "", "alignment": "center", "width": 100}})
            continue
        for paragraph in re.split(r"\n\s*\n", part):
            text = paragraph.strip()
            if text:
                nodes.append({"type": "paragraph", "content": [{"type": "text", "text": text}]})
    return {"type": "doc", "content": nodes or [{"type": "paragraph"}]}


def upgrade() -> None:
    op.execute("ALTER TYPE articlestatus ADD VALUE IF NOT EXISTS 'scheduled'")

    op.create_table(
        "categories",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("name", sa.String(80), nullable=False, unique=True),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_categories_slug", "categories", ["slug"], unique=True)
    op.create_table(
        "tags",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("name", sa.String(60), nullable=False, unique=True),
        sa.Column("slug", sa.String(80), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_tags_slug", "tags", ["slug"], unique=True)
    op.create_table(
        "article_tags",
        sa.Column("article_id", sa.Uuid(), sa.ForeignKey("articles.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("tag_id", sa.Uuid(), sa.ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
    )

    op.add_column("articles", sa.Column("content_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    bind = op.get_bind()
    rows = bind.execute(sa.text("SELECT id, content FROM articles")).mappings().all()
    for row in rows:
        media_urls = {
            str(media["id"]).lower(): media["url"]
            for media in bind.execute(sa.text("SELECT id, url FROM media_assets WHERE article_id = :article_id"), {"article_id": row["id"]}).mappings()
        }
        bind.execute(
            sa.text("UPDATE articles SET content_json = CAST(:content AS jsonb) WHERE id = :id"),
            {"content": json.dumps(_legacy_content_document(row["content"], media_urls), ensure_ascii=False), "id": row["id"]},
        )
    op.alter_column("articles", "content_json", nullable=False)
    op.drop_column("articles", "content")
    op.alter_column("articles", "content_json", new_column_name="content")
    op.alter_column("articles", "cover_media_url", new_column_name="featured_image_url")
    op.add_column("articles", sa.Column("social_image_url", sa.String(500), nullable=True))
    op.add_column("articles", sa.Column("seo_title", sa.String(120), nullable=True))
    op.add_column("articles", sa.Column("meta_description", sa.String(320), nullable=True))
    op.add_column("articles", sa.Column("category_id", sa.Uuid(), nullable=True))
    op.add_column("articles", sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True))
    op.create_foreign_key("fk_articles_category_id", "articles", "categories", ["category_id"], ["id"], ondelete="SET NULL")
    op.create_index("ix_articles_category_id", "articles", ["category_id"])
    op.create_index("ix_articles_scheduled_at", "articles", ["scheduled_at"])
    op.create_index("ix_articles_published_at", "articles", ["published_at"])

    op.add_column("media_assets", sa.Column("storage_key", sa.String(500), nullable=True))
    op.add_column("media_assets", sa.Column("mime_type", sa.String(100), nullable=True))
    op.add_column("media_assets", sa.Column("alt_text", sa.String(300), nullable=False, server_default=""))
    op.add_column("media_assets", sa.Column("caption", sa.String(500), nullable=False, server_default=""))
    op.add_column("media_assets", sa.Column("width", sa.Integer(), nullable=True))
    op.add_column("media_assets", sa.Column("height", sa.Integer(), nullable=True))
    op.add_column("media_assets", sa.Column("file_size", sa.Integer(), nullable=False, server_default="0"))
    op.execute("UPDATE media_assets SET storage_key = ltrim(url, '/'), mime_type = CASE WHEN lower(url) LIKE '%.png' THEN 'image/png' WHEN lower(url) LIKE '%.webp' THEN 'image/webp' WHEN lower(url) LIKE '%.gif' THEN 'image/gif' WHEN lower(url) LIKE '%.mp4' THEN 'video/mp4' WHEN lower(url) LIKE '%.webm' THEN 'video/webm' WHEN lower(url) LIKE '%.mov' THEN 'video/quicktime' ELSE 'image/jpeg' END")
    op.alter_column("media_assets", "storage_key", nullable=False)
    op.alter_column("media_assets", "mime_type", nullable=False)
    op.create_index("ix_media_assets_storage_key", "media_assets", ["storage_key"], unique=True)
    op.drop_constraint("media_assets_article_id_fkey", "media_assets", type_="foreignkey")
    op.create_foreign_key("media_assets_article_id_fkey", "media_assets", "articles", ["article_id"], ["id"], ondelete="SET NULL")

    categories = sa.table("categories", sa.column("id", sa.Uuid()), sa.column("name", sa.String()), sa.column("slug", sa.String()))
    op.bulk_insert(categories, [
        {"id": uuid.uuid4(), "name": "نورولوژی کودکان", "slug": "child-neurology"},
        {"id": uuid.uuid4(), "name": "صرع", "slug": "epilepsy"},
        {"id": uuid.uuid4(), "name": "رشد و تکامل", "slug": "development"},
        {"id": uuid.uuid4(), "name": "بیش‌فعالی و توجه", "slug": "adhd"},
        {"id": uuid.uuid4(), "name": "سلامت عمومی", "slug": "general-health"},
    ])


def downgrade() -> None:
    op.drop_constraint("media_assets_article_id_fkey", "media_assets", type_="foreignkey")
    op.create_foreign_key("media_assets_article_id_fkey", "media_assets", "articles", ["article_id"], ["id"], ondelete="CASCADE")
    op.drop_index("ix_media_assets_storage_key", table_name="media_assets")
    for column in ("file_size", "height", "width", "caption", "alt_text", "mime_type", "storage_key"):
        op.drop_column("media_assets", column)

    op.drop_index("ix_articles_published_at", table_name="articles")
    op.drop_index("ix_articles_scheduled_at", table_name="articles")
    op.drop_index("ix_articles_category_id", table_name="articles")
    op.drop_constraint("fk_articles_category_id", "articles", type_="foreignkey")
    for column in ("scheduled_at", "category_id", "meta_description", "seo_title", "social_image_url"):
        op.drop_column("articles", column)
    op.alter_column("articles", "featured_image_url", new_column_name="cover_media_url")
    op.add_column("articles", sa.Column("content_text", sa.Text(), nullable=True))
    op.execute("UPDATE articles SET content_text = content::text")
    op.drop_column("articles", "content")
    op.alter_column("articles", "content_text", new_column_name="content", nullable=False)

    op.drop_table("article_tags")
    op.drop_index("ix_tags_slug", table_name="tags")
    op.drop_table("tags")
    op.drop_index("ix_categories_slug", table_name="categories")
    op.drop_table("categories")
