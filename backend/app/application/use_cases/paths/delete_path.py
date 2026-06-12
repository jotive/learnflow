from uuid import UUID

from app.domain.entities import User, utcnow
from app.domain.exceptions import PathNotFoundError
from app.domain.policies import ensure_owner
from app.domain.ports import LearningPathRepository


class DeletePath:
    def __init__(self, paths: LearningPathRepository) -> None:
        self.paths = paths

    def execute(self, actor: User, path_id: UUID) -> None:
        path = self.paths.get(path_id)
        if path is None:
            raise PathNotFoundError()
        ensure_owner(path, actor)
        path.soft_delete(actor.id, utcnow())
        self.paths.update(path)
