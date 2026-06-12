from uuid import UUID

from app.domain.entities import LearningPath, User
from app.domain.exceptions import PathNotFoundError
from app.domain.policies import ensure_can_view
from app.domain.ports import LearningPathRepository


class GetPath:
    def __init__(self, paths: LearningPathRepository) -> None:
        self.paths = paths

    def execute(self, actor: User, path_id: UUID) -> LearningPath:
        path = self.paths.get(path_id)
        if path is None:
            raise PathNotFoundError()
        ensure_can_view(path, actor)
        return path
