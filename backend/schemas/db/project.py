from pydantic import BaseModel


class ProjectDB(BaseModel):
    uuid: str
    title: str
    description: str
