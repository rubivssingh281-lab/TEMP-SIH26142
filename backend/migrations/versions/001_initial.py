"""Create the initial production job schema.

Revision ID: 001_initial
Revises:
"""

from alembic import op
import sqlalchemy as sa


revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "jobs",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("project_id", sa.String(), nullable=True),
        sa.Column("org_id", sa.String(), nullable=True),
        sa.Column("owner_id", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("model", sa.String(), nullable=False),
        sa.Column("satellite_source", sa.String(), nullable=True),
        sa.Column("target_resolution_m", sa.Float(), nullable=True),
        sa.Column("bands", sa.JSON(), nullable=True),
        sa.Column("aoi_coordinates", sa.JSON(), nullable=True),
        sa.Column("progress", sa.Integer(), nullable=True),
        sa.Column("error_code", sa.String(), nullable=True),
        sa.Column("error_message", sa.String(), nullable=True),
        sa.Column("area_km2", sa.Float(), nullable=True),
        sa.Column("lr_resolution", sa.String(), nullable=True),
        sa.Column("sr_resolution", sa.String(), nullable=True),
        sa.Column("lr_image_key", sa.String(), nullable=True),
        sa.Column("sr_image_key", sa.String(), nullable=True),
        sa.Column("uncertainty_image_key", sa.String(), nullable=True),
        sa.Column("psnr", sa.Float(), nullable=True),
        sa.Column("ssim", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_jobs_status", "jobs", ["status"], unique=False)
    op.create_index("ix_jobs_project_id", "jobs", ["project_id"], unique=False)
    op.create_index("ix_jobs_org_id", "jobs", ["org_id"], unique=False)
    op.create_index("ix_jobs_owner_id", "jobs", ["owner_id"], unique=False)

    op.create_table(
        "job_stages",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("job_id", sa.String(), nullable=True),
        sa.Column("name", sa.String(), nullable=True),
        sa.Column("state", sa.String(), nullable=True),
        sa.Column("detail", sa.String(), nullable=True),
        sa.Column("progress", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["job_id"], ["jobs.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_job_stages_job_id", "job_stages", ["job_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_job_stages_job_id", table_name="job_stages")
    op.drop_table("job_stages")
    op.drop_index("ix_jobs_owner_id", table_name="jobs")
    op.drop_index("ix_jobs_org_id", table_name="jobs")
    op.drop_index("ix_jobs_project_id", table_name="jobs")
    op.drop_index("ix_jobs_status", table_name="jobs")
    op.drop_table("jobs")
