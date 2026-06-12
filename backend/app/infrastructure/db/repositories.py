from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session, joinedload, selectinload

from app.domain.entities import Activity, LearningPath, Role, User
from app.domain.enums import ActivityStatus, Priority, RoleCode
from app.domain.pagination import Page, Pagination
from app.domain.ports import ActivityRepository, LearningPathRepository, UserRepository
from app.infrastructure.db.models import ActivityModel, LearningPathModel, RoleModel, UserModel


def role_to_domain(model: RoleModel) -> Role:
    return Role(id=UUID(model.id), code=RoleCode(model.code), name=model.name)


def role_to_model(role: Role) -> RoleModel:
    return RoleModel(id=str(role.id), code=role.code.value, name=role.name)


def user_to_domain(model: UserModel) -> User:
    return User(
        id=UUID(model.id),
        email=model.email,
        name=model.name,
        role=role_to_domain(model.role),
        hashed_password=model.hashed_password,
        is_active=model.is_active,
        created_at=model.created_at,
    )


def activity_to_domain(model: ActivityModel) -> Activity:
    return Activity(
        id=UUID(model.id),
        path_id=UUID(model.path_id),
        title=model.title,
        description=model.description,
        priority=Priority(model.priority),
        is_mandatory=model.is_mandatory,
        status=ActivityStatus(model.status),
        assigned_to=UUID(model.assigned_to) if model.assigned_to else None,
        position=model.position,
        created_at=model.created_at,
        updated_at=model.updated_at,
        deleted_at=model.deleted_at,
        deleted_by=UUID(model.deleted_by) if model.deleted_by else None,
    )


def path_to_domain(model: LearningPathModel) -> LearningPath:
    return LearningPath(
        id=UUID(model.id),
        title=model.title,
        description=model.description,
        created_by=UUID(model.created_by),
        completed_at=model.completed_at,
        created_at=model.created_at,
        updated_at=model.updated_at,
        deleted_at=model.deleted_at,
        deleted_by=UUID(model.deleted_by) if model.deleted_by else None,
        activities=[
            activity_to_domain(activity)
            for activity in model.activities
            if activity.deleted_at is None
        ],
    )


class SqlAlchemyUserRepository(UserRepository):
    def __init__(self, session: Session) -> None:
        self.session = session

    def add(self, user: User) -> None:
        self.session.merge(role_to_model(user.role))
        self.session.add(
            UserModel(
                id=str(user.id),
                email=user.email,
                name=user.name,
                role_id=str(user.role.id),
                hashed_password=user.hashed_password,
                is_active=user.is_active,
                created_at=user.created_at,
            )
        )

    def get_by_id(self, user_id: UUID) -> User | None:
        model = self.session.scalar(
            select(UserModel)
            .options(joinedload(UserModel.role))
            .where(UserModel.id == str(user_id))
        )
        return user_to_domain(model) if model else None

    def get_by_email(self, email: str) -> User | None:
        model = self.session.scalar(
            select(UserModel).options(joinedload(UserModel.role)).where(UserModel.email == email)
        )
        return user_to_domain(model) if model else None

    def list_members(self, page: Pagination) -> Page[User]:
        is_member = (RoleModel.code == RoleCode.MEMBER.value, UserModel.is_active.is_(True))
        total = self.session.scalar(
            select(func.count()).select_from(UserModel).join(UserModel.role).where(*is_member)
        )
        models = self.session.scalars(
            select(UserModel)
            .options(joinedload(UserModel.role))
            .join(UserModel.role)
            .where(*is_member)
            .order_by(UserModel.name)
            .limit(page.limit)
            .offset(page.offset)
        ).all()
        return Page(
            items=[user_to_domain(model) for model in models],
            total=total or 0,
            limit=page.limit,
            offset=page.offset,
        )

    def update(self, user: User) -> None:
        model = self.session.get(UserModel, str(user.id))
        if model is None:
            return
        model.name = user.name
        model.email = user.email
        model.hashed_password = user.hashed_password
        model.is_active = user.is_active

    def delete(self, user_id: UUID) -> None:
        self.session.execute(
            update(ActivityModel)
            .where(ActivityModel.assigned_to == str(user_id))
            .values(assigned_to=None)
        )
        model = self.session.get(UserModel, str(user_id))
        if model:
            model.is_active = False


class SqlAlchemyLearningPathRepository(LearningPathRepository):
    def __init__(self, session: Session) -> None:
        self.session = session

    def add(self, path: LearningPath) -> None:
        self.session.add(
            LearningPathModel(
                id=str(path.id),
                title=path.title,
                description=path.description,
                created_by=str(path.created_by),
                completed_at=path.completed_at,
                created_at=path.created_at,
                updated_at=path.updated_at,
                deleted_at=path.deleted_at,
                deleted_by=str(path.deleted_by) if path.deleted_by else None,
            )
        )

    def get(self, path_id: UUID) -> LearningPath | None:
        model = self.session.scalar(
            select(LearningPathModel)
            .options(selectinload(LearningPathModel.activities))
            .where(LearningPathModel.id == str(path_id))
            .where(LearningPathModel.deleted_at.is_(None))
        )
        return path_to_domain(model) if model else None

    def list_owned_by(self, leader_id: UUID, page: Pagination) -> Page[LearningPath]:
        owned = (
            LearningPathModel.created_by == str(leader_id),
            LearningPathModel.deleted_at.is_(None),
        )
        total = self.session.scalar(
            select(func.count()).select_from(LearningPathModel).where(*owned)
        )
        models = self.session.scalars(
            select(LearningPathModel)
            .options(selectinload(LearningPathModel.activities))
            .where(*owned)
            .order_by(LearningPathModel.created_at)
            .limit(page.limit)
            .offset(page.offset)
        ).all()
        return Page(
            items=[path_to_domain(model) for model in models],
            total=total or 0,
            limit=page.limit,
            offset=page.offset,
        )

    def list_assigned_to(self, member_id: UUID, page: Pagination) -> Page[LearningPath]:
        assigned = (
            ActivityModel.assigned_to == str(member_id),
            LearningPathModel.deleted_at.is_(None),
            ActivityModel.deleted_at.is_(None),
        )
        total = self.session.scalar(
            select(func.count(func.distinct(LearningPathModel.id)))
            .select_from(LearningPathModel)
            .join(ActivityModel)
            .where(*assigned)
        )
        models = self.session.scalars(
            select(LearningPathModel)
            .join(ActivityModel)
            .options(selectinload(LearningPathModel.activities))
            .where(*assigned)
            .distinct()
            .order_by(LearningPathModel.created_at)
            .limit(page.limit)
            .offset(page.offset)
        ).all()
        return Page(
            items=[path_to_domain(model) for model in models],
            total=total or 0,
            limit=page.limit,
            offset=page.offset,
        )

    def update(self, path: LearningPath) -> None:
        model = self.session.get(LearningPathModel, str(path.id))
        if model is None:
            return
        model.title = path.title
        model.description = path.description
        model.completed_at = path.completed_at
        model.updated_at = path.updated_at
        model.deleted_at = path.deleted_at
        model.deleted_by = str(path.deleted_by) if path.deleted_by else None


class SqlAlchemyActivityRepository(ActivityRepository):
    def __init__(self, session: Session) -> None:
        self.session = session

    def add(self, activity: Activity) -> None:
        self.session.add(
            ActivityModel(
                id=str(activity.id),
                path_id=str(activity.path_id),
                title=activity.title,
                description=activity.description,
                priority=activity.priority.value,
                is_mandatory=activity.is_mandatory,
                status=activity.status.value,
                assigned_to=str(activity.assigned_to) if activity.assigned_to else None,
                position=activity.position,
                created_at=activity.created_at,
                updated_at=activity.updated_at,
                deleted_at=activity.deleted_at,
                deleted_by=str(activity.deleted_by) if activity.deleted_by else None,
            )
        )

    def get(self, activity_id: UUID) -> Activity | None:
        model = self.session.scalar(
            select(ActivityModel)
            .where(ActivityModel.id == str(activity_id))
            .where(ActivityModel.deleted_at.is_(None))
        )
        return activity_to_domain(model) if model else None

    def list_for_path(self, path_id: UUID) -> list[Activity]:
        models = self.session.scalars(
            select(ActivityModel)
            .where(ActivityModel.path_id == str(path_id))
            .where(ActivityModel.deleted_at.is_(None))
            .order_by(ActivityModel.position)
        ).all()
        return [activity_to_domain(model) for model in models]

    def update(self, activity: Activity) -> None:
        model = self.session.get(ActivityModel, str(activity.id))
        if model is None:
            return
        model.title = activity.title
        model.description = activity.description
        model.priority = activity.priority.value
        model.is_mandatory = activity.is_mandatory
        model.status = activity.status.value
        model.assigned_to = str(activity.assigned_to) if activity.assigned_to else None
        model.position = activity.position
        model.updated_at = activity.updated_at
        model.deleted_at = activity.deleted_at
        model.deleted_by = str(activity.deleted_by) if activity.deleted_by else None
