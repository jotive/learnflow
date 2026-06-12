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


class SesNotifier(Notifier):
    def __init__(self, sender: str, region: str, locale: str = DEFAULT_LOCALE) -> None:
        import boto3

        self._sender = sender
        self._locale = locale
        self._client = boto3.client("ses", region_name=region)

    def send_invitation(self, user: User) -> None:
        self._send(user.email, invitation_message(user, self._locale))

    def send_assignment(self, user: User, activity: Activity) -> None:
        self._send(user.email, assignment_message(user, activity, self._locale))

    def _send(self, recipient: str, message: EmailMessage) -> None:
        self._client.send_email(
            Source=self._sender,
            Destination={"ToAddresses": [recipient]},
            Message={
                "Subject": {"Data": message.subject},
                "Body": {"Text": {"Data": message.body}},
            },
        )
        logger.info("ses email sent to %s", recipient)
