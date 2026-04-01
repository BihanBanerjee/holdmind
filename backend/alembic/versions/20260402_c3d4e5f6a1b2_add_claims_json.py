"""add claims_json to chat_messages

Revision ID: c3d4e5f6a1b2
Revises: b2c3d4e5f6a1
Create Date: 2026-04-02
"""
from alembic import op
import sqlalchemy as sa

revision = "c3d4e5f6a1b2"
down_revision = "b2c3d4e5f6a1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("chat_messages", sa.Column("claims_json", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("chat_messages", "claims_json")
