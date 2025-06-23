from sqlalchemy import select

from backend.services.sqlstore.base_repository import SQLAlchemyRepository
from backend.services.sqlstore.models.sessions.model import Session


class SessionRepository(SQLAlchemyRepository):
    model = Session

    async def get_all_by_user_id(self, user_id: int):
        result = await self.session.execute(
            select(Session).where(Session.user_id == user_id)
        )
        return result.scalars().all()
