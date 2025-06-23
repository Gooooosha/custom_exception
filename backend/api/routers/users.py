from fastapi import APIRouter, Depends

from backend.schemas.api.user import UserRequest
from backend.schemas.db.user import UserDB
from backend.api.dependency import require_role
from backend.enums.role import Role
from backend.services.sqlstore.database_session import get_session
from backend.services.sqlstore.models.users.repository import UserRepository
from backend.services.utils.hash_creator import get_password_hash

router = APIRouter()


@router.get("/")
async def get_all_users(user: UserDB = Depends(require_role(Role.project_manager, Role.admin))):
    async with get_session() as db_session:
        repo = UserRepository(db_session)
        return await repo.get_all()


@router.delete("/{user_id}")
async def delete_project(
        user_id: int,
        user: UserDB = Depends(require_role(Role.project_manager, Role.admin))
):
    async with get_session() as db_session:
        repo = UserRepository(db_session)
        await repo.delete_one(id=user_id)
    return {"message": "User deleted"}


@router.post("/")
async def add_user(payload: UserRequest,
                   user: UserDB = Depends(require_role(Role.project_manager, Role.admin))):
    async with get_session() as db_session:
        repo = UserRepository(db_session)
        payload = payload.model_dump()
        payload["password"] = get_password_hash(payload["password"])
        await repo.add_one(**payload)
    return {"message": "ok"}
