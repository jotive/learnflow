OPENAPI_TAGS = [
    {
        "name": "Health",
        "description": "API status, health checks, and basic local observability.",
    },
    {
        "name": "Auth",
        "description": "JWT authentication. Use the returned token as Bearer credentials.",
    },
    {
        "name": "Users",
        "description": "Authenticated user profile and leader-only member provisioning.",
    },
    {
        "name": "Paths",
        "description": "Learning path CRUD and compliance sign-off.",
    },
    {
        "name": "Activities",
        "description": "Path activities, status updates, filters, and member assignment.",
    },
]

OPENAPI_DESCRIPTION = (
    "LearnFlow lets leaders create learning paths, add mandatory or optional "
    "activities, assign members, and sign off compliance once mandatory work is done.\n\n"
    "## API route structure\n\n"
    "- `GET /`: API welcome/status message.\n"
    "- `GET /health`: machine-readable health check.\n"
    "- `GET /metrics`: in-memory request and error counters.\n"
    "- `/auth`: login and JWT issuing.\n"
    "- `/users`: authenticated profile, member listing, and member provisioning.\n"
    "- `/paths`: learning path CRUD, list, detail, and compliance sign-off.\n"
    "- `/paths/{path_id}/activities`: create and list activities inside a path, "
    "with status/priority filters.\n"
    "- `/activities`: update, delete, assign, and progress individual activities."
)

OPENAPI_CONTACT = {"name": "Josse / jotive"}
