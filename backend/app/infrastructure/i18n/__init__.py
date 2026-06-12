from app.infrastructure.i18n import en, es

DEFAULT_LOCALE = "es"
CATALOGS = {"es": es.MESSAGES, "en": en.MESSAGES}


def resolve_locale(accept_language: str | None) -> str:
    if not accept_language:
        return DEFAULT_LOCALE
    primary = accept_language.split(",")[0].strip().lower()[:2]
    return primary if primary in CATALOGS else DEFAULT_LOCALE


def get_message(code: str, locale: str) -> str:
    catalog = CATALOGS.get(locale, CATALOGS[DEFAULT_LOCALE])
    return catalog.get(code) or CATALOGS[DEFAULT_LOCALE]["domain_error"]
