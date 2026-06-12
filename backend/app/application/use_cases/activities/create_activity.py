from app.application.dtos import CreateActivityCommand
from app.domain.entities import Activity, User
from app.domain.exceptions import PathNotFoundError
from app.domain.policies import ensure_owner
from app.domain.ports import ActivityRepository, LearningPathRepository


class CreateActivity:
    def __init__(self, paths: LearningPathRepository, activities: ActivityRepository) -> None:
        self.paths = paths
        self.activities = activities

    def execute(self, actor: User, command: CreateActivityCommand) -> Activity:
        path = self.paths.get(command.path_id)
        if path is None:
            raise PathNotFoundError()
        ensure_owner(path, actor)
        activity = Activity(
            path_id=command.path_id,
            title=command.title,
            description=command.description,
            priority=command.priority,
            is_mandatory=command.is_mandatory,
            position=command.position,
        )
        self.activities.add(activity)
        return activity
