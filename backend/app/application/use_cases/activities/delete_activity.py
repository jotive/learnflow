from uuid import UUID

from app.domain.entities import User, utcnow
from app.domain.exceptions import ActivityNotFoundError, PathNotFoundError
from app.domain.policies import ensure_owner
from app.domain.ports import ActivityRepository, LearningPathRepository


class DeleteActivity:
    def __init__(self, paths: LearningPathRepository, activities: ActivityRepository) -> None:
        self.paths = paths
        self.activities = activities

    def execute(self, actor: User, activity_id: UUID) -> None:
        activity = self.activities.get(activity_id)
        if activity is None:
            raise ActivityNotFoundError()
        path = self.paths.get(activity.path_id)
        if path is None:
            raise PathNotFoundError()
        ensure_owner(path, actor)
        activity.soft_delete(actor.id, utcnow())
        self.activities.update(activity)
