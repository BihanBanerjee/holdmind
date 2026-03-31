"""add patterns_json to users

Revision ID: a1b2c3d4e5f6
Revises: f8e9d7c6b5a4
Create Date: 2026-03-31 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'f8e9d7c6b5a4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('patterns_json', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'patterns_json')
