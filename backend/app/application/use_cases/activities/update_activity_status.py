from uuid import UUID

from app.domain.entities import Activity, User, utcnow
from app.domain.enums import ActivityStatus
from app.domain.exceptions import ActivityNotFoundError, PathNotFoundError
from app.domain.policies import ensure_can_change_activity_status
from app.domain.ports import ActivityRepository, LearningPathRepository


class UpdateActivityStatus:
    def __init__(self, paths: LearningPathRepository, activities: ActivityRepository) -> None:
        self.paths = paths
        self.activities = activities

    def execute(self, actor: User, activity_id: UUID, status: ActivityStatus) -> Activity:
        activity = self.activities.get(activity_id)
        if activity is None:
            raise ActivityNotFoundError()
        path = self.paths.get(activity.path_id)
        if path is None:
            raise PathNotFoundError()
        ensure_can_change_activity_status(path, activity, actor)
        activity.status = status
        activity.updated_at = utcnow()
        self.activities.update(activity)
        return activity
