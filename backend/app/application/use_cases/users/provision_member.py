from app.application.dtos import ProvisionMemberCommand
from app.domain.entities import User
from app.domain.exceptions import EmailAlreadyRegisteredError
from app.domain.policies import require_leader
from app.domain.ports import Notifier, PasswordHasher, UserRepository
from app.domain.roles import MEMBER_ROLE


class ProvisionMember:
    def __init__(self, users: UserRepository, hasher: PasswordHasher, notifier: Notifier) -> None:
        self.users = users
        self.hasher = hasher
        self.notifier = notifier

    def execute(self, actor: User, command: ProvisionMemberCommand) -> User:
        require_leader(actor)
        if self.users.get_by_email(command.email) is not None:
            raise EmailAlreadyRegisteredError()
        user = User(
            email=command.email,
            name=command.name,
            role=MEMBER_ROLE,
            hashed_password=self.hasher.hash(command.password),
        )
        self.users.add(user)
        self.notifier.send_invitation(user)
        return user
