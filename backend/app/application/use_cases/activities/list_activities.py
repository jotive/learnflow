from uuid import UUID

from app.application.dtos import ActivityFilters
from app.domain.entities import Activity, LearningPath, User
from app.domain.exceptions import PathNotFoundError
from app.domain.policies import ensure_can_view
from app.domain.ports import LearningPathRepository


class ListActivities:
    def __init__(self, paths: LearningPathRepository) -> None:
        self.paths = paths

    def execute(
        self, actor: User, path_id: UUID, filters: ActivityFilters
    ) -> tuple[LearningPath, list[Activity]]:
        path = self.paths.get(path_id)
        if path is None:
            raise PathNotFoundError()
        ensure_can_view(path, actor)
        activities = path.activities
        if filters.status is not None:
            activities = [activity for activity in activities if activity.status is filters.status]
        if filters.priority is not None:
            activities = [
                activity for activity in activities if activity.priority is filters.priority
            ]
        return path, activities
