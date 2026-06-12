from app.domain.entities import LearningPath, User
from app.domain.enums import RoleCode
from app.domain.pagination import Page, Pagination
from app.domain.ports import LearningPathRepository


class ListPaths:
    def __init__(self, paths: LearningPathRepository) -> None:
        self.paths = paths

    def execute(self, actor: User, page: Pagination) -> Page[LearningPath]:
        if actor.role.code is RoleCode.LEADER:
            return self.paths.list_owned_by(actor.id, page)
        return self.paths.list_assigned_to(actor.id, page)
