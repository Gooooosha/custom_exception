from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from backend.schemas.db.project import ProjectDB
from backend.schemas.api.project import ProjectRequest
from backend.schemas.db.user import UserDB
from backend.api.dependency import require_role
from backend.enums.role import Role
from backend.services.sqlstore.database_session import get_session
from backend.services.sqlstore.models.projects.repository import ProjectRepository
from backend.services.sqlstore.models.user_projects.repository import UserProjectRepository
from backend.services.sqlstore.models.users.repository import UserRepository
from backend.services.sqlstore.models.user_projects.model import UserProject
from backend.services.utils.uuid_creator import get_uuid
from backend.services.utils.logger import Logger
from sqlalchemy import delete

router = APIRouter()
logger = Logger(__name__)


@router.get("/", response_model=List[ProjectDB])
async def get_all_projects():
    async with get_session() as db_session:
        repo = ProjectRepository(db_session)
        projects = await repo.get_all()
    return projects


@router.post("/")
async def add_project(payload: ProjectRequest,
                      user: UserDB = Depends(require_role(Role.project_manager, Role.admin))):
    async with get_session() as db_session:
        repo = ProjectRepository(db_session)
        payload = payload.model_dump()
        payload["uuid"] = get_uuid()
        project = await repo.add_one(**payload)
    logger.info(f"Project with uuid {project} was added to DB with user {user.name}")
    return {"message": "ok"}


@router.get("/{project_uuid}/members", response_model=List[UserDB])
async def get_project_members(
        project_uuid: str,
        user: UserDB = Depends(require_role(Role.user, Role.admin))
):
    async with get_session() as db_session:
        repo = ProjectRepository(db_session)
        project = await repo.get_one(uuid=project_uuid)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        users = await repo.get_project_users(project_uuid)
        return users


@router.post("/{project_uuid}/members/{user_id}")
async def add_project_member(
        project_uuid: str,
        user_id: int,
        user: UserDB = Depends(require_role(Role.project_manager, Role.admin))
):
    async with get_session() as db_session:
        project_repo = ProjectRepository(db_session)
        project = await project_repo.get_one(uuid=project_uuid)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

        user_repo = UserRepository(db_session)
        user_to_add = await user_repo.get_one(id=user_id)
        if not user_to_add:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        user_project_repo = UserProjectRepository(db_session)
        await user_project_repo.add_one(
            user_id=user_id,
            project_uuid=project_uuid,
        )
    return {"message": "User added to project"}


@router.delete("/{project_uuid}/members/{user_id}")
async def remove_project_member(
        project_uuid: str,
        user_id: int,
        user: UserDB = Depends(require_role(Role.project_manager, Role.admin))
):
    async with get_session() as db_session:
        result = await db_session.execute(
            delete(UserProject)
            .where(UserProject.user_id == user_id)
            .where(UserProject.project_uuid == project_uuid)
        )
        await db_session.commit()

        if result.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User is not a member of this project"
            )

    logger.info(f"User {user_id} was removed from project {project_uuid} by {user.name}")
    return {"message": "User removed from project"}


@router.delete("/{project_uuid}")
async def delete_project(
        project_uuid: str,
        user: UserDB = Depends(require_role(Role.project_manager, Role.admin))
):
    async with get_session() as db_session:
        repo = ProjectRepository(db_session)
        await repo.delete_one(uuid=project_uuid)
    logger.info(f"Project {project_uuid} was deleted by user {user.name}")
    return {"message": "Project deleted"}
