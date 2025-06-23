from pydantic import BaseModel


class UserDB(BaseModel):
    id: int
    login: str
    password: str
    name: str
    role: str
