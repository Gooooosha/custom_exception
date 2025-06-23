from datetime import datetime

from sqlalchemy import Column, Integer, ForeignKey, String, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from backend.services.sqlstore.database_init import Base


class Session(Base):
    __tablename__ = "sessions"

    uuid: str = Column(UUID(as_uuid=False), primary_key=True)
    user_id: int = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    expires_at: datetime = Column(DateTime(timezone=True), nullable=False)
    ip_address: str | None = Column(String(45))
    user_agent: str | None = Column(Text)

    user = relationship("User", back_populates="sessions")

    def __repr__(self) -> str:
        return f"<Session id={self.uuid} user_id={self.user_id}>"
