"""add deadline/modality to services and time_chronos to users

Revision ID: 00adb1771f76
Revises: 302e60a63201
Create Date: 2026-04-16 08:55:45.350711

"""
from alembic import op
import sqlalchemy as sa


revision = '00adb1771f76'
down_revision = '302e60a63201'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('time_chronos', sa.Integer(), nullable=False, server_default='0'))

    with op.batch_alter_table('services', schema=None) as batch_op:
        batch_op.add_column(sa.Column('deadline', sa.Date(), nullable=True))
        batch_op.add_column(sa.Column('modality', sa.String(length=20), nullable=True))


def downgrade():
    with op.batch_alter_table('services', schema=None) as batch_op:
        batch_op.drop_column('modality')
        batch_op.drop_column('deadline')

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('time_chronos')
