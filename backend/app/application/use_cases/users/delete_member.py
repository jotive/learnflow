from uuid import UUID

from app.domain.entities import User
from app.domain.exceptions import UserNotFoundError
from app.domain.policies import require_leader
from app.domain.ports import UserRepository


class DeleteMember:
    def __init__(self, users: UserRepository) -> None:
        self.users = users

    def execute(self, actor: User, member_id: UUID) -> None:
        require_leader(actor)
        member = self.users.get_by_id(member_id)
        if member is None:
            raise UserNotFoundError()
        self.users.delete(member_id)
