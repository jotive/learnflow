from uuid import UUID

from app.application.dtos import UpdateMemberCommand
from app.domain.entities import User
from app.domain.exceptions import EmailAlreadyRegisteredError, UserNotFoundError
from app.domain.policies import require_leader
from app.domain.ports import PasswordHasher, UserRepository


class UpdateMember:
    def __init__(self, users: UserRepository, hasher: PasswordHasher) -> None:
        self.users = users
        self.hasher = hasher

    def execute(self, actor: User, member_id: UUID, command: UpdateMemberCommand) -> User:
        require_leader(actor)
        member = self.users.get_by_id(member_id)
        if member is None:
            raise UserNotFoundError()

        if command.email is not None and command.email != member.email:
            existing = self.users.get_by_email(command.email)
            if existing is not None and existing.id != member.id:
                raise EmailAlreadyRegisteredError()
            member.email = command.email

        if command.name is not None:
            member.name = command.name

        if command.password is not None:
            member.hashed_password = self.hasher.hash(command.password)

        self.users.update(member)
        return member
