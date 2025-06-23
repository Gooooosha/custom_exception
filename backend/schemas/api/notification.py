from pydantic import BaseModel


class NotificationRequest(BaseModel):
    project_uuid: str
    title: str
    description: str = None
    type: str = None
    url: str = None
    channel: str = None
    username: str = None
