from uuid import UUID

from app.domain.entities import Activity, User, utcnow
from app.domain.exceptions import ActivityNotFoundError, PathNotFoundError, UserNotFoundError
from app.domain.policies import ensure_assignee_is_member, ensure_owner
from app.domain.ports import (
    ActivityRepository,
    LearningPathRepository,
    Notifier,
    UserRepository,
)


class AssignActivity:
    def __init__(
        self,
        paths: LearningPathRepository,
        activities: ActivityRepository,
        users: UserRepository,
        notifier: Notifier,
    ) -> None:
        self.paths = paths
        self.activities = activities
        self.users = users
        self.notifier = notifier

    def execute(self, actor: User, activity_id: UUID, user_id: UUID | None) -> Activity:
        activity = self.activities.get(activity_id)
        if activity is None:
            raise ActivityNotFoundError()
        path = self.paths.get(activity.path_id)
        if path is None:
            raise PathNotFoundError()
        ensure_owner(path, actor)
        if user_id is None:
            activity.assigned_to = None
            activity.updated_at = utcnow()
            self.activities.update(activity)
            return activity
        assignee = self.users.get_by_id(user_id)
        if assignee is None:
            raise UserNotFoundError()
        ensure_assignee_is_member(assignee)
        activity.assigned_to = assignee.id
        activity.updated_at = utcnow()
        self.activities.update(activity)
        self.notifier.send_assignment(assignee, activity)
        return activity
