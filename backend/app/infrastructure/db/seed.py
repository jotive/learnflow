from app.domain.entities import Activity, LearningPath, User
from app.domain.enums import ActivityStatus, Priority
from app.domain.pagination import Pagination
from app.domain.roles import LEADER_ROLE, MEMBER_ROLE
from app.infrastructure.auth.security import BcryptPasswordHasher
from app.infrastructure.db.repositories import (
    SqlAlchemyActivityRepository,
    SqlAlchemyLearningPathRepository,
    SqlAlchemyUserRepository,
)
from app.infrastructure.db.session import SessionLocal

DEMO_USERS = [
    ("leader@learnflow.dev", "Lia Leader", LEADER_ROLE, "leader-pass"),
    ("member1@learnflow.dev", "Max Member", MEMBER_ROLE, "member-pass"),
    ("member2@learnflow.dev", "Mia Member", MEMBER_ROLE, "member-pass"),
]

DEMO_PATH_TITLE = "Backend onboarding"

DEMO_ACTIVITIES = [
    ("Security and compliance onboarding", Priority.HIGH, True, ActivityStatus.COMPLETED),
    ("Git workflow and code review basics", Priority.MEDIUM, True, ActivityStatus.NOT_STARTED),
    ("FastAPI fundamentals course", Priority.HIGH, False, ActivityStatus.IN_PROGRESS),
    ("Team wiki deep dive", Priority.LOW, False, ActivityStatus.NOT_STARTED),
]


def ensure_users(users: SqlAlchemyUserRepository, hasher: BcryptPasswordHasher) -> dict[str, User]:
    ensured: dict[str, User] = {}
    for email, name, role, password in DEMO_USERS:
        user = users.get_by_email(email)
        if user is None:
            user = User(email=email, name=name, role=role, hashed_password=hasher.hash(password))
            users.add(user)
            print(f"seeded {role.code.value}: {email} / {password}")
        ensured[email] = user
    return ensured


def ensure_demo_path(
    paths: SqlAlchemyLearningPathRepository,
    activities: SqlAlchemyActivityRepository,
    leader: User,
    member: User,
) -> None:
    owned = paths.list_owned_by(leader.id, Pagination(limit=1000, offset=0))
    if any(path.title == DEMO_PATH_TITLE for path in owned.items):
        return
    path = LearningPath(
        title=DEMO_PATH_TITLE,
        description="Ramp-up track for new backend hires",
        created_by=leader.id,
    )
    paths.add(path)
    for position, (title, priority, is_mandatory, status) in enumerate(DEMO_ACTIVITIES, start=1):
        activities.add(
            Activity(
                path_id=path.id,
                title=title,
                priority=priority,
                is_mandatory=is_mandatory,
                status=status,
                assigned_to=member.id,
                position=position,
            )
        )
    print(f"seeded path: {DEMO_PATH_TITLE} -> {member.email}")


def run() -> None:
    hasher = BcryptPasswordHasher()
    with SessionLocal() as session:
        users = SqlAlchemyUserRepository(session)
        paths = SqlAlchemyLearningPathRepository(session)
        activities = SqlAlchemyActivityRepository(session)
        ensured = ensure_users(users, hasher)
        ensure_demo_path(
            paths,
            activities,
            ensured["leader@learnflow.dev"],
            ensured["member1@learnflow.dev"],
        )
        session.commit()


if __name__ == "__main__":
    run()
