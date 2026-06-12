from uuid import UUID

from app.application.dtos import UpdateActivityCommand
from app.domain.entities import Activity, User, utcnow
from app.domain.exceptions import ActivityNotFoundError, PathNotFoundError
from app.domain.policies import ensure_owner
from app.domain.ports import ActivityRepository, LearningPathRepository


class UpdateActivity:
    def __init__(self, paths: LearningPathRepository, activities: ActivityRepository) -> None:
        self.paths = paths
        self.activities = activities

    def execute(self, actor: User, activity_id: UUID, command: UpdateActivityCommand) -> Activity:
        activity = self.activities.get(activity_id)
        if activity is None:
            raise ActivityNotFoundError()
        path = self.paths.get(activity.path_id)
        if path is None:
            raise PathNotFoundError()
        ensure_owner(path, actor)
        if command.title is not None:
            activity.title = command.title
        if command.description is not None:
            activity.description = command.description
        if command.priority is not None:
            activity.priority = command.priority
        if command.is_mandatory is not None:
            activity.is_mandatory = command.is_mandatory
        if command.position is not None:
            activity.position = command.position
        activity.updated_at = utcnow()
        self.activities.update(activity)
        return activity
