import json
import logging
from contextvars import ContextVar
from logging.handlers import RotatingFileHandler

from app.infrastructure.settings import settings

request_id_var: ContextVar[str] = ContextVar("request_id", default="-")

TEXT_FORMAT = "%(asctime)s %(levelname)s %(name)s [%(request_id)s] %(message)s"
JSON_FIELDS = ("asctime", "levelname", "name", "message", "request_id")


class RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_var.get()
        return True


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        record.message = record.getMessage()
        record.asctime = self.formatTime(record)
        payload = {field: getattr(record, field, None) for field in JSON_FIELDS}
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload)


def build_formatter() -> logging.Formatter:
    return JsonFormatter() if settings.log_json else logging.Formatter(TEXT_FORMAT)


def build_handlers() -> list[logging.Handler]:
    formatter = build_formatter()
    request_id_filter = RequestIdFilter()
    handlers: list[logging.Handler] = [logging.StreamHandler()]
    if settings.log_file:
        handlers.append(
            RotatingFileHandler(
                settings.log_file,
                maxBytes=settings.log_max_bytes,
                backupCount=settings.log_backup_count,
                encoding="utf-8",
            )
        )
    for handler in handlers:
        handler.setFormatter(formatter)
        handler.addFilter(request_id_filter)
    return handlers


def configure_logging() -> None:
    root = logging.getLogger()
    root.handlers.clear()
    root.setLevel(settings.log_level.upper())
    for handler in build_handlers():
        root.addHandler(handler)
