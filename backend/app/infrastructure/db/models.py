from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def db_utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class RoleModel(Base):
    __tablename__ = "roles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(80))

    users: Mapped[list["UserModel"]] = relationship(back_populates="role")


class UserModel(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    role_id: Mapped[str] = mapped_column(ForeignKey("roles.id"), index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=db_utcnow)

    role: Mapped[RoleModel] = relationship(back_populates="users")
    owned_paths: Mapped[list["LearningPathModel"]] = relationship(
        back_populates="creator",
        cascade="all, delete-orphan",
        foreign_keys="LearningPathModel.created_by",
    )


class LearningPathModel(Base):
    __tablename__ = "learning_paths"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    title: Mapped[str] = mapped_column(String(160))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=db_utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=db_utcnow, onupdate=db_utcnow
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_by: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    creator: Mapped[UserModel] = relationship(
        back_populates="owned_paths", foreign_keys=[created_by]
    )
    activities: Mapped[list["ActivityModel"]] = relationship(
        back_populates="path", cascade="all, delete-orphan", order_by="ActivityModel.position"
    )


class ActivityModel(Base):
    __tablename__ = "activities"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    path_id: Mapped[str] = mapped_column(ForeignKey("learning_paths.id"), index=True)
    title: Mapped[str] = mapped_column(String(180))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    priority: Mapped[str] = mapped_column(String(20), index=True)
    is_mandatory: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(20), index=True)
    assigned_to: Mapped[str | None] = mapped_column(
        ForeignKey("users.id"), nullable=True, index=True
    )
    position: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=db_utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=db_utcnow, onupdate=db_utcnow
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_by: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    path: Mapped[LearningPathModel] = relationship(back_populates="activities")
    assignee: Mapped[UserModel | None] = relationship(foreign_keys=[assigned_to])
