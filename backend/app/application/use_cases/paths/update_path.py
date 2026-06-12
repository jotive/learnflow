from uuid import UUID

from app.application.dtos import UpdatePathCommand
from app.domain.entities import LearningPath, User
from app.domain.exceptions import PathNotFoundError
from app.domain.policies import ensure_owner
from app.domain.ports import LearningPathRepository


class UpdatePath:
    def __init__(self, paths: LearningPathRepository) -> None:
        self.paths = paths

    def execute(self, actor: User, path_id: UUID, command: UpdatePathCommand) -> LearningPath:
        path = self.paths.get(path_id)
        if path is None:
            raise PathNotFoundError()
        ensure_owner(path, actor)
        if command.title is not None:
            path.title = command.title
        if command.description is not None:
            path.description = command.description
        self.paths.update(path)
        return path
