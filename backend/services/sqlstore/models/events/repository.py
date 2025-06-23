from sqlalchemy import select

from backend.services.sqlstore.base_repository import SQLAlchemyRepository
from backend.services.sqlstore.models.events.model import Event
from backend.services.sqlstore.models.projects.model import Project
from backend.services.sqlstore.models.user_projects.model import UserProject


def orm_to_dict(obj):
    return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}


class EventRepository(SQLAlchemyRepository):
    model = Event

    async def get_events_for_user(self, user_id: int) -> list[dict]:
        stmt = (
            select(
                Event,
                Project.uuid.label("project_uuid"),
                Project.title.label("project_title")
            )
            .join(Project, Project.uuid == Event.project_uuid)
            .join(UserProject, UserProject.project_uuid == Project.uuid)
            .where(UserProject.user_id == user_id)
            .order_by(Event.timestamp.desc())
        )

        result = await self.session.execute(stmt)

        events: list[dict] = []
        for event_obj, proj_uuid, proj_title in result.all():
            row = orm_to_dict(event_obj)
            row["project_uuid"] = proj_uuid
            row["project_title"] = proj_title
            events.append(row)

        return events

    async def get_events_with_project_title(self) -> list[dict]:
        stmt = (
            select(Event, Project.title)
            .join(Project, Project.uuid == Event.project_uuid)
            .order_by(Event.timestamp.desc())
        )

        result = await self.session.execute(stmt)

        events: list[dict] = []
        for event_obj, project_title in result.all():
            row = orm_to_dict(event_obj)
            row["project_title"] = project_title
            events.append(row)

        print(events)
        return events
