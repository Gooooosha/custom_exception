from pydantic import BaseModel


class UserRequest(BaseModel):
    name: str
    login: str
    password: str
