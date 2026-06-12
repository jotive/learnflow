from dataclasses import dataclass

from app.domain.entities import Activity, User
from app.infrastructure.i18n import DEFAULT_LOCALE

EMAIL_TEMPLATES = {
    "es": {
        "invitation": {
            "subject": "Bienvenido a LearnFlow",
            "body": "Hola {name}, se creó una cuenta para ti.",
        },
        "assignment": {
            "subject": "Nueva actividad asignada",
            "body": "Hola {name}, se te asignó: {title}.",
        },
    },
    "en": {
        "invitation": {
            "subject": "Welcome to LearnFlow",
            "body": "Hello {name}, an account was created for you.",
        },
        "assignment": {
            "subject": "New activity assigned",
            "body": "Hello {name}, you were assigned: {title}.",
        },
    },
}


@dataclass(frozen=True)
class EmailMessage:
    subject: str
    body: str


def _template(locale: str, key: str) -> dict[str, str]:
    catalog = EMAIL_TEMPLATES.get(locale, EMAIL_TEMPLATES[DEFAULT_LOCALE])
    return catalog[key]


def invitation_message(user: User, locale: str = DEFAULT_LOCALE) -> EmailMessage:
    template = _template(locale, "invitation")
    return EmailMessage(
        subject=template["subject"],
        body=template["body"].format(name=user.name),
    )


def assignment_message(
    user: User, activity: Activity, locale: str = DEFAULT_LOCALE
) -> EmailMessage:
    template = _template(locale, "assignment")
    return EmailMessage(
        subject=template["subject"],
        body=template["body"].format(name=user.name, title=activity.title),
    )
