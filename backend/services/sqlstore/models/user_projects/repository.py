from backend.services.sqlstore.base_repository import SQLAlchemyRepository
from backend.services.sqlstore.models.user_projects.model import UserProject


class UserProjectRepository(SQLAlchemyRepository):
    model = UserProject
