class DomainError(Exception):
    code: str = "domain_error"


class InvalidCredentialsError(DomainError):
    code = "invalid_credentials"


class PermissionDeniedError(DomainError):
    code = "permission_denied"


class UserNotFoundError(DomainError):
    code = "user_not_found"


class PathNotFoundError(DomainError):
    code = "path_not_found"


class ActivityNotFoundError(DomainError):
    code = "activity_not_found"


class EmailAlreadyRegisteredError(DomainError):
    code = "email_already_registered"


class AssigneeMustBeMemberError(DomainError):
    code = "assignee_must_be_member"


class PathHasNoActivitiesError(DomainError):
    code = "path_has_no_activities"


class PathHasPendingMandatoryActivitiesError(DomainError):
    code = "path_has_pending_mandatory_activities"
