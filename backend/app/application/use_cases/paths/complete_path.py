from uuid import UUID

from app.domain.entities import LearningPath, User, utcnow
from app.domain.exceptions import PathNotFoundError
from app.domain.policies import ensure_owner
from app.domain.ports import LearningPathRepository


class CompletePath:
    def __init__(self, paths: LearningPathRepository) -> None:
        self.paths = paths

    def execute(self, actor: User, path_id: UUID) -> LearningPath:
        path = self.paths.get(path_id)
        if path is None:
            raise PathNotFoundError()
        ensure_owner(path, actor)
        path.sign_off(utcnow())
        self.paths.update(path)
        return path
