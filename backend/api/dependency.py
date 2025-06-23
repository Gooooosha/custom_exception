from datetime import datetime, timezone
from fastapi import Request, HTTPException, Depends, status

from backend.enums.role import Role
from backend.schemas.db.user import UserDB
from backend.services.sqlstore.database_session import get_session
from backend.services.sqlstore.models.sessions.repository import SessionRepository
from backend.services.sqlstore.models.users.repository import UserRepository
from backend.services.utils.config import Config


async def get_current_user(request: Request) -> UserDB:
    session_uuid = request.cookies.get(Config.SESSION_COOKIE_NAME)

    if not session_uuid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized"
        )

    async with get_session() as db_session:
        repo: SessionRepository = SessionRepository(db_session)
        session = await repo.get_one(**{
            "uuid": session_uuid
        })

    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized"
        )

    if session.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized"
        )

    async with get_session() as db_session:
        repo: UserRepository = UserRepository(db_session)
        user = await repo.get_one(**{
            "id": session.user_id
        })

    return UserDB(id=user.id, login=user.login, password=user.password, name=user.name, role=user.role)


def require_role(*allowed_roles: Role):
    async def checker(user: UserDB = Depends(get_current_user)):
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden"
            )
        return user

    return checker
