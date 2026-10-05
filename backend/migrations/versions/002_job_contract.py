"""Persist the documented job lifecycle and result contract.

Revision ID: 002_job_contract
Revises: 001_initial
"""

from alembic import op
import sqlalchemy as sa


revision = "002_job_contract"
down_revision = "001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("jobs", sa.Column("stage", sa.String(), nullable=True))
    op.add_column("jobs", sa.Column("scale_factor", sa.Integer(), nullable=True))
    op.add_column("jobs", sa.Column("output_res_m", sa.Float(), nullable=True))
    op.add_column("jobs", sa.Column("metrics_summary", sa.JSON(), nullable=True))
    op.add_column(
        "jobs",
        sa.Column("calibration_status", sa.String(), server_default="not_evaluated", nullable=True),
    )
    op.add_column("jobs", sa.Column("degradation_tier", sa.Integer(), nullable=True))
    op.add_column("jobs", sa.Column("validation_level", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("jobs", "validation_level")
    op.drop_column("jobs", "degradation_tier")
    op.drop_column("jobs", "calibration_status")
    op.drop_column("jobs", "metrics_summary")
    op.drop_column("jobs", "output_res_m")
    op.drop_column("jobs", "scale_factor")
    op.drop_column("jobs", "stage")
