from datetime import datetime

from pydantic import BaseModel


class SessionDB(BaseModel):
    id: int
    user_id: int
    expires_at: datetime
    ip_address: str
    user_agent: str
