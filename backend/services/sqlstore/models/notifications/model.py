from datetime import datetime

from sqlalchemy import ForeignKey, Integer, Column, String, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from backend.services.sqlstore.database_init import Base


class Notification(Base):
    __tablename__ = "notifications"

    id: int = Column(Integer, primary_key=True)
    title: str = Column(String(255), nullable=False)
    description: str | None = Column(Text)
    type: str = Column(String(50))
    url: str | None = Column(Text)

    channel: str | None = Column(String(100))
    username: str | None = Column(String(100))

    created_at: datetime = Column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )

    project_uuid: str = Column(UUID(as_uuid=False), ForeignKey("projects.uuid"), nullable=False)

    project = relationship("Project", back_populates="notifications")

    def __repr__(self) -> str:
        return f"<Notification id={self.id} project={self.project_uuid} type={self.type!r}>"
