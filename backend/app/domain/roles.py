from uuid import UUID

from app.domain.entities import Role
from app.domain.enums import RoleCode

LEADER_ROLE_ID = UUID("11111111-1111-1111-1111-111111111111")
MEMBER_ROLE_ID = UUID("22222222-2222-2222-2222-222222222222")

LEADER_ROLE = Role(id=LEADER_ROLE_ID, code=RoleCode.LEADER, name="Leader")
MEMBER_ROLE = Role(id=MEMBER_ROLE_ID, code=RoleCode.MEMBER, name="Member")

DEFAULT_ROLES = [LEADER_ROLE, MEMBER_ROLE]


def role_from_code(code: RoleCode) -> Role:
    return LEADER_ROLE if code is RoleCode.LEADER else MEMBER_ROLE
