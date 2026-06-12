from app.application.dtos import CreatePathCommand
from app.domain.entities import LearningPath, User
from app.domain.policies import require_leader
from app.domain.ports import LearningPathRepository


class CreatePath:
    def __init__(self, paths: LearningPathRepository) -> None:
        self.paths = paths

    def execute(self, actor: User, command: CreatePathCommand) -> LearningPath:
        require_leader(actor)
        path = LearningPath(
            title=command.title,
            description=command.description,
            created_by=actor.id,
        )
        self.paths.add(path)
        return path
