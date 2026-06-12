import logging

from app.domain.entities import Activity, User
from app.domain.ports import Notifier
from app.infrastructure.email.messages import (
    EmailMessage,
    assignment_message,
    invitation_message,
)
from app.infrastructure.i18n import DEFAULT_LOCALE

logger = logging.getLogger("learnflow.notifications")


class ResendNotifier(Notifier):
    def __init__(
        self, api_key: str, sender: str, endpoint: str, locale: str = DEFAULT_LOCALE
    ) -> None:
        self._sender = sender
        self._endpoint = endpoint
        self._locale = locale
        self._headers = {"Authorization": f"Bearer {api_key}"}

    def send_invitation(self, user: User) -> None:
        self._send(user.email, invitation_message(user, self._locale))

    def send_assignment(self, user: User, activity: Activity) -> None:
        self._send(user.email, assignment_message(user, activity, self._locale))

    def _send(self, recipient: str, message: EmailMessage) -> None:
        import httpx

        response = httpx.post(
            self._endpoint,
            headers=self._headers,
            json={
                "from": self._sender,
                "to": [recipient],
                "subject": message.subject,
                "text": message.body,
            },
            timeout=10,
        )
        response.raise_for_status()
        logger.info("resend email sent to %s", recipient)
