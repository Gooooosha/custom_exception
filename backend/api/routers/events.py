from fastapi import APIRouter, HTTPException, Request, status, Depends
from fastapi.responses import JSONResponse

from backend.api.dependency import require_role
from backend.enums.role import Role
from backend.schemas.api.link import EventLinkResponse
from backend.services.notifications.base import WebhookSender
from backend.services.notifications.mattermost import MattermostWebhookSender
from backend.services.notifications.slack import SlackWebhookSender
from backend.services.sqlstore.database_session import get_session
from backend.services.sqlstore.models.events.repository import EventRepository
from backend.services.sqlstore.models.notifications.repository import NotificationRepository
from backend.services.utils.config import Config
from backend.services.utils.logger import Logger
from backend.services.utils.sentry import Sentry

router = APIRouter()
logger = Logger(__name__)


@router.get("/project/{project_uuid}/link", response_model=EventLinkResponse)
async def get_event_link(project_uuid: str):
    link = f"{Config.BACKEND_PROTOCOL}://{project_uuid}@{Config.BACKEND_HOST}:{Config.BACKEND_PORT}/0"
    return {"link": link}


@router.post("/{project_id}/envelope/")
async def envelope_endpoint(request: Request, project_id: int):
    envelope = await Sentry.parse_as_model(request)

    if not envelope:
        logger.error(f"Empty envelope received for project {project_id}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bad_request")

    async with get_session() as db_session:
        repo = EventRepository(db_session)
        event = await repo.add_one(**envelope.model_dump())
        logger.info(f"Event with uuid {event} was added to DB")

    async with get_session() as db_session:
        repo = NotificationRepository(db_session)
        notifications = await repo.get_all(
            **{
                "project_uuid": envelope.project_uuid
            }
        )

    for notification in notifications:
        event_data = {
            "uuid": envelope.uuid,
            "exception_type": envelope.type,
            "exception_message": envelope.value,
            "timestamp": envelope.timestamp,
            "path": envelope.abs_path,
            "server_name": envelope.server_name,
            "severity": envelope.level,
            "line": envelope.lineno
        }
        if notification.get("type") == "mattermost":
            webhook = MattermostWebhookSender(notification.get("url"))
            event_data["channel"] = notification.get("channel")
            event_data["username"] = notification.get("username")
        elif notification.get("type") == "slack":
            webhook = SlackWebhookSender(notification.get("url"))
            event_data["channel"] = notification.get("channel")
            event_data["username"] = notification.get("username")
        else:
            webhook = WebhookSender(notification.get("url"))

        await webhook.send_text(event_data)

    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={
            "status": "received",
            "project_id": project_id,
        }
    )


@router.get("/events")
async def get_events(user=Depends(require_role(Role.user, Role.project_manager, Role.admin))):
    async with get_session() as db_session:
        repo = EventRepository(db_session)
        if user.role == "user":
            events = await repo.get_events_for_user(user.id)
        else:
            events = await repo.get_events_with_project_title()

    return events
