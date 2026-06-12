from app.domain.entities import Activity, LearningPath, User
from app.domain.enums import RoleCode
from app.domain.exceptions import AssigneeMustBeMemberError, PermissionDeniedError


def require_leader(actor: User) -> None:
    if actor.role.code is not RoleCode.LEADER:
        raise PermissionDeniedError()


def ensure_owner(path: LearningPath, actor: User) -> None:
    if actor.role.code is not RoleCode.LEADER or path.created_by != actor.id:
        raise PermissionDeniedError()


def ensure_assignee_is_member(assignee: User) -> None:
    if assignee.role.code is not RoleCode.MEMBER or not assignee.is_active:
        raise AssigneeMustBeMemberError()


def ensure_can_view(path: LearningPath, actor: User) -> None:
    if actor.role.code is RoleCode.LEADER and path.created_by == actor.id:
        return
    if any(activity.assigned_to == actor.id for activity in path.activities):
        return
    raise PermissionDeniedError()


def ensure_can_change_activity_status(path: LearningPath, activity: Activity, actor: User) -> None:
    if actor.role.code is RoleCode.LEADER and path.created_by == actor.id:
        return
    if activity.assigned_to == actor.id:
        return
    raise PermissionDeniedError()
