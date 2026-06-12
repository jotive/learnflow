from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "202606120002"
down_revision: str | Sequence[str] | None = "202606110001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default="1",
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "is_active")
