"""Add authenticated ownership to application tracking.

Existing anonymous records remain unclaimed (user_id NULL).
"""

from alembic import op
import sqlalchemy as sa

revision = "0003_application_ownership"
down_revision = "0002_auth"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("application_tracking") as batch_op:
        batch_op.add_column(
            sa.Column("user_id", sa.Integer(), nullable=True)
        )
        batch_op.alter_column(
            "session_key",
            existing_type=sa.String(64),
            nullable=True,
        )
        batch_op.create_foreign_key(
            "fk_application_tracking_user",
            "users",
            ["user_id"],
            ["id"],
        )
        batch_op.create_unique_constraint(
            "uq_user_scheme",
            ["user_id", "scheme_id"],
        )
        batch_op.create_index(
            "ix_application_tracking_user_id",
            ["user_id"],
        )


def downgrade():
    # Explicitly disallow a potentially destructive rollback.
    raise RuntimeError(
        "Ownership migration downgrade is disabled. "
        "Restore a verified database backup instead."
    )
