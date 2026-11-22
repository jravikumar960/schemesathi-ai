from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.scheme import utcnow


class ApplicationStatus(str, Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    SUBMITTED = "SUBMITTED"
    COMPLETED = "COMPLETED"


class ApplicationTracking(Base):
    __tablename__ = "application_tracking"
    __table_args__ = (
        UniqueConstraint("session_key", "scheme_id", name="uq_session_scheme"),
        UniqueConstraint("user_id", "scheme_id", name="uq_user_scheme"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_key: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True, index=True
    )
    scheme_id: Mapped[int] = mapped_column(ForeignKey("schemes.id"))
    status: Mapped[ApplicationStatus] = mapped_column(
        SAEnum(ApplicationStatus, native_enum=False, length=32, validate_strings=True),
        default=ApplicationStatus.NOT_STARTED,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    scheme: Mapped["Scheme"] = relationship("Scheme")


