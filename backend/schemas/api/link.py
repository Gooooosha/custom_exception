from pydantic import BaseModel


class EventLinkResponse(BaseModel):
    link: str
