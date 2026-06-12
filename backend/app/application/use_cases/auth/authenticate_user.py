from app.domain.entities import User
from app.domain.exceptions import InvalidCredentialsError
from app.domain.ports import PasswordHasher, UserRepository


class AuthenticateUser:
    def __init__(self, users: UserRepository, hasher: PasswordHasher) -> None:
        self.users = users
        self.hasher = hasher

    def execute(self, email: str, password: str) -> User:
        user = self.users.get_by_email(email)
        if user is None or not user.is_active:
            raise InvalidCredentialsError()
        if not self.hasher.verify(password, user.hashed_password):
            raise InvalidCredentialsError()
        return user
