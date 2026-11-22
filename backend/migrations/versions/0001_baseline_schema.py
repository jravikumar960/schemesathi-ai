"""baseline schema: schemes and application_tracking

Idempotent: a table is created only if it is missing, so this can run against
a database that was built earlier by Base.metadata.create_all(). Every table
this revision creates is recorded in migration_created_tables; downgrade drops
only those recorded tables and leaves pre-existing ones untouched.

Revision ID: 0001_baseline
Revises:
Create Date: 2026-11-22

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001_baseline"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

OWNERSHIP_TABLE = "migration_created_tables"


def _existing_tables(bind) -> set[str]:
    return set(sa.inspect(bind).get_table_names())


def _ensure_ownership_table(bind) -> None:
    if OWNERSHIP_TABLE not in _existing_tables(bind):
        op.create_table(
            OWNERSHIP_TABLE,
            sa.Column("revision", sa.String(64), nullable=False),
            sa.Column("table_name", sa.String(128), nullable=False),
            sa.PrimaryKeyConstraint("revision", "table_name"),
        )


def _record_owned(bind, table_name: str) -> None:
    bind.execute(
        sa.text(
            f"INSERT INTO {OWNERSHIP_TABLE} (revision, table_name) "
            "VALUES (:rev, :tbl)"
        ),
        {"rev": revision, "tbl": table_name},
    )


def upgrade() -> None:
    bind = op.get_bind()
    existing = _existing_tables(bind)
    _ensure_ownership_table(bind)

    if "schemes" not in existing:
        op.create_table(
            "schemes",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(255), nullable=False),
            sa.Column("slug", sa.String(255), nullable=False),
            sa.Column("description", sa.Text(), nullable=False),
            sa.Column("benefit_summary", sa.Text(), nullable=False),
            sa.Column("level", sa.String(64), nullable=False),
            sa.Column("eligibility_conditions", sa.JSON(), nullable=False),
            sa.Column("document_requirements", sa.JSON(), nullable=False),
            sa.Column("application_steps", sa.JSON(), nullable=False),
            sa.Column("official_url", sa.String(500), nullable=False),
            sa.Column("application_deadline", sa.Date(), nullable=True),
            sa.Column("source_verified_on", sa.Date(), nullable=True),
            sa.Column("verification_status", sa.String(64), nullable=False),
            sa.Column("is_illustrative", sa.Boolean(), nullable=False),
            sa.Column("last_updated", sa.DateTime(timezone=True), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_schemes_slug", "schemes", ["slug"], unique=True)
        _record_owned(bind, "schemes")

    if "application_tracking" not in existing:
        op.create_table(
            "application_tracking",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("session_key", sa.String(64), nullable=False),
            sa.Column("scheme_id", sa.Integer(), nullable=False),
            sa.Column("status", sa.String(32), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("session_key", "scheme_id", name="uq_session_scheme"),
            sa.ForeignKeyConstraint(["scheme_id"], ["schemes.id"]),
        )
        op.create_index(
            "ix_application_tracking_session_key",
            "application_tracking",
            ["session_key"],
            unique=False,
        )
        _record_owned(bind, "application_tracking")


def downgrade() -> None:
    bind = op.get_bind()
    existing = _existing_tables(bind)
    if OWNERSHIP_TABLE not in existing:
        return

    owned = {
        row[0]
        for row in bind.execute(
            sa.text(f"SELECT table_name FROM {OWNERSHIP_TABLE} WHERE revision = :rev"),
            {"rev": revision},
        )
    }

    # Drop children before parents.
    for name in ("application_tracking", "schemes"):
        if name in owned and name in existing:
            op.drop_table(name)

    bind.execute(
        sa.text(f"DELETE FROM {OWNERSHIP_TABLE} WHERE revision = :rev"),
        {"rev": revision},
    )
    remaining = bind.execute(sa.text(f"SELECT COUNT(*) FROM {OWNERSHIP_TABLE}")).scalar()
    if remaining == 0:
        op.drop_table(OWNERSHIP_TABLE)
