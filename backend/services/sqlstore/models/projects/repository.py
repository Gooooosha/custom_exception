from sqlalchemy import select

from backend.services.sqlstore.base_repository import SQLAlchemyRepository
from backend.services.sqlstore.models.projects.model import Project
from backend.services.sqlstore.models.users.model import User


class ProjectRepository(SQLAlchemyRepository):
    model = Project

    async def get_project_users(self, project_uuid: str):
        result = await self.session.execute(
            select(User)
            .join(Project.users)
            .where(Project.uuid == project_uuid)
        )
        return result.scalars().all()
