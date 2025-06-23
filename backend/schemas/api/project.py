from pydantic import BaseModel


class ProjectRequest(BaseModel):
    title: str
    description: str
