import logging

from app.domain.entities import Activity, User
from app.domain.ports import Notifier
from app.infrastructure.email.messages import assignment_message, invitation_message
from app.infrastructure.i18n import DEFAULT_LOCALE

logger = logging.getLogger("learnflow.notifications")


class LoggingNotifier(Notifier):
    def __init__(self, locale: str = DEFAULT_LOCALE) -> None:
        self._locale = locale

    def send_invitation(self, user: User) -> None:
        message = invitation_message(user, self._locale)
        logger.info("notification to %s: %s", user.email, message.subject)

    def send_assignment(self, user: User, activity: Activity) -> None:
        message = assignment_message(user, activity, self._locale)
        logger.info("notification to %s: %s", user.email, message.subject)
