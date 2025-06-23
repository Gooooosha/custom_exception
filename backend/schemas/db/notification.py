from pydantic import BaseModel


class NotificationDB(BaseModel):
    id: int
    title: str
    description: str
    type: str
    url: str
    channel: str = None
    username: str = None
