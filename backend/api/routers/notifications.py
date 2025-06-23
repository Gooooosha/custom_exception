from fastapi import APIRouter, Depends, status, HTTPException
from typing import List

from backend.api.dependency import require_role
from backend.enums.role import Role
from backend.schemas.api.notification import NotificationRequest
from backend.schemas.db.notification import NotificationDB
from backend.services.sqlstore.database_session import get_session
from backend.services.sqlstore.models.notifications.repository import NotificationRepository
from backend.services.sqlstore.models.projects.repository import ProjectRepository
from backend.services.utils.logger import Logger

router = APIRouter()

logger = Logger(__name__)


@router.get("/", response_model=List[NotificationDB])
async def get_notifications():
    async with get_session() as db_session:
        repo = NotificationRepository(db_session)
        notifications = await repo.get_all()
    return notifications


@router.post("/")
async def create_notification(
        payload: NotificationRequest,
        user=Depends(require_role(Role.project_manager, Role.admin))
):
    async with get_session() as session:
        project_repo = ProjectRepository(session)
        if not await project_repo.get_one(uuid=payload.project_uuid):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not_found")

        notif_repo = NotificationRepository(session)
        notification = await notif_repo.add_one(**payload.model_dump())

    return notification


@router.delete("/{notification_id}")
async def delete_notification(notification_id: int,
                              user=Depends(require_role(Role.project_manager, Role.admin))):
    async with get_session() as db_session:
        repo = NotificationRepository(db_session)
        await repo.delete_one(id=notification_id)
    logger.info(f"Project {notification_id} was deleted by user {user.name}")
    return {"message": "Notification deleted"}
