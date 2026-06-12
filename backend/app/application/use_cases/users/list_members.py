from app.domain.entities import User
from app.domain.pagination import Page, Pagination
from app.domain.policies import require_leader
from app.domain.ports import UserRepository


class ListMembers:
    def __init__(self, users: UserRepository) -> None:
        self.users = users

    def execute(self, actor: User, page: Pagination) -> Page[User]:
        require_leader(actor)
        return self.users.list_members(page)
