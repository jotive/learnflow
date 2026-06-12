import json
import logging
import logging.handlers

from app.infrastructure import logging as logging_module
from app.infrastructure.logging import (
    JsonFormatter,
    RequestIdFilter,
    build_formatter,
    build_handlers,
    configure_logging,
    request_id_var,
)


def make_record(message: str = "hello", exc_info=None) -> logging.LogRecord:
    return logging.LogRecord(
        name="learnflow.test",
        level=logging.INFO,
        pathname=__file__,
        lineno=1,
        msg=message,
        args=(),
        exc_info=exc_info,
    )


def test_request_id_filter_stamps_current_context_value():
    token = request_id_var.set("req-123")
    try:
        record = make_record()
        assert RequestIdFilter().filter(record) is True
        assert record.request_id == "req-123"
    finally:
        request_id_var.reset(token)


def test_json_formatter_emits_expected_fields():
    record = make_record("structured line")
    record.request_id = "req-abc"
    payload = json.loads(JsonFormatter().format(record))
    assert payload["levelname"] == "INFO"
    assert payload["name"] == "learnflow.test"
    assert payload["message"] == "structured line"
    assert payload["request_id"] == "req-abc"
    assert "exception" not in payload


def test_json_formatter_includes_exception_when_present():
    try:
        raise ValueError("boom")
    except ValueError as error:
        record = make_record("failed", exc_info=(type(error), error, error.__traceback__))
    record.request_id = "-"
    payload = json.loads(JsonFormatter().format(record))
    assert "ValueError: boom" in payload["exception"]


def test_build_formatter_switches_on_log_json(monkeypatch):
    monkeypatch.setattr(logging_module.settings, "log_json", True)
    assert isinstance(build_formatter(), JsonFormatter)
    monkeypatch.setattr(logging_module.settings, "log_json", False)
    assert not isinstance(build_formatter(), JsonFormatter)


def test_build_handlers_adds_rotating_file_handler(monkeypatch, tmp_path):
    log_file = tmp_path / "app.log"
    monkeypatch.setattr(logging_module.settings, "log_file", str(log_file))
    monkeypatch.setattr(logging_module.settings, "log_json", False)
    handlers = build_handlers()
    try:
        assert any(
            isinstance(handler, logging.handlers.RotatingFileHandler) for handler in handlers
        )
        assert all(handler.filters for handler in handlers)
    finally:
        for handler in handlers:
            handler.close()


def test_build_handlers_streams_only_without_log_file(monkeypatch):
    monkeypatch.setattr(logging_module.settings, "log_file", None)
    handlers = build_handlers()
    try:
        assert len(handlers) == 1
        assert isinstance(handlers[0], logging.StreamHandler)
    finally:
        for handler in handlers:
            handler.close()


def test_configure_logging_resets_root_handlers(monkeypatch):
    monkeypatch.setattr(logging_module.settings, "log_file", None)
    monkeypatch.setattr(logging_module.settings, "log_level", "warning")
    configure_logging()
    root = logging.getLogger()
    try:
        assert root.level == logging.WARNING
        assert len(root.handlers) == 1
    finally:
        configure_logging()
