from app.infrastructure.i18n import get_message, resolve_locale


def test_resolve_locale_defaults_when_header_absent():
    assert resolve_locale(None) == "es"


def test_resolve_locale_reads_primary_language():
    assert resolve_locale("en-US,en;q=0.9") == "en"


def test_resolve_locale_falls_back_for_unknown_language():
    assert resolve_locale("fr") == "es"


def test_get_message_translates_known_code():
    assert get_message("path_not_found", "en") != get_message("path_not_found", "es")


def test_get_message_falls_back_to_default_domain_error():
    assert get_message("nonexistent_code", "es") == get_message("domain_error", "es")
