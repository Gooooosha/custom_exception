from backend.services.sqlstore.base_repository import SQLAlchemyRepository
from backend.services.sqlstore.models.notifications.model import Notification


class NotificationRepository(SQLAlchemyRepository):
    model = Notification
