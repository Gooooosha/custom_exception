from fastapi import APIRouter, Request, Response, Depends, HTTPException, status
from datetime import datetime, timedelta, timezone
from backend.schemas.api.login import LoginRequest
from backend.services.sqlstore.database_session import get_session
from backend.services.sqlstore.models.users.repository import UserRepository
from backend.services.sqlstore.models.sessions.repository import SessionRepository
from backend.services.utils.hash_creator import check_password
from backend.services.utils.uuid_creator import get_uuid
from backend.services.utils.config import Config
from backend.services.utils.logger import Logger
from backend.api.dependency import require_role
from backend.enums.role import Role
from backend.schemas.db.user import UserDB

router = APIRouter()
logger = Logger(__name__)


@router.post("/login")
async def login_user(payload: LoginRequest, request: Request, response: Response):
    async with get_session() as db_session:
        repo = UserRepository(db_session)
        user = await repo.get_one(login=payload.login)

    if not user or not check_password(payload.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    session_uuid = get_uuid()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=Config.SESSION_LIFETIME)
    ip_address = request.client.host
    user_agent = request.headers.get("user-agent")

    async with get_session() as db_session:
        repo = SessionRepository(db_session)
        session = await repo.add_one(
            uuid=session_uuid,
            user_id=user.id,
            expires_at=expires_at,
            ip_address=ip_address,
            user_agent=user_agent
        )
        logger.info(f"Session with uuid {session} was added to DB")

    max_age = int(timedelta(minutes=Config.SESSION_LIFETIME).total_seconds())
    response.set_cookie(
        key=Config.SESSION_COOKIE_NAME,
        value=session_uuid,
        httponly=True,
        samesite="none",
        secure=True,
        max_age=max_age,
    )
    return {"message": "ok"}


async def logout(request: Request, response: Response):
    session_uuid = request.cookies.get(Config.SESSION_COOKIE_NAME)
    if session_uuid:
        async with get_session() as db_session:
            repo = SessionRepository(db_session)
            await repo.delete_one(uuid=session_uuid)
        response.delete_cookie(Config.SESSION_COOKIE_NAME)
    return {"message": "logged out"}


@router.get("/me")
def me(user: UserDB = Depends(require_role(Role.user, Role.admin))):
    return {"role": user.role}
