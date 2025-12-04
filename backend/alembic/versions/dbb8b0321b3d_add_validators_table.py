"""add_validators_table

Revision ID: dbb8b0321b3d
Revises: 7a50fcad6210
Create Date: 2025-12-04 14:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'dbb8b0321b3d'
down_revision: Union[str, None] = '7a50fcad6210'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create validators table
    op.create_table('validators',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('employee_id', sa.String(length=50), nullable=True),
        sa.Column('department', sa.String(length=100), nullable=True),
        sa.Column('specialization', sa.String(length=255), nullable=True),
        sa.Column('certifications', postgresql.JSON(astext_type=sa.Text()), nullable=False, server_default='[]'),
        sa.Column('max_concurrent_dossiers', sa.String(length=10), nullable=False, server_default='10'),
        sa.Column('validation_stats', postgresql.JSON(astext_type=sa.Text()), nullable=False, server_default='{}'),
        sa.Column('notes', sa.String(), nullable=True),
        sa.Column('active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_validators_user_id'), 'validators', ['user_id'], unique=True)
    op.create_index(op.f('ix_validators_employee_id'), 'validators', ['employee_id'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_validators_employee_id'), table_name='validators')
    op.drop_index(op.f('ix_validators_user_id'), table_name='validators')
    op.drop_table('validators')
