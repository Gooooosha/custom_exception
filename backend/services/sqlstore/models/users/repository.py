from backend.services.sqlstore.base_repository import SQLAlchemyRepository
from backend.services.sqlstore.models.users.model import User


class UserRepository(SQLAlchemyRepository):
    model = User
