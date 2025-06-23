from datetime import datetime

from sqlalchemy import Column, String, ForeignKey, Text, Integer, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from backend.services.sqlstore.database_init import Base


class Event(Base):
    __tablename__ = "events"

    uuid: str = Column(UUID(as_uuid=False), primary_key=True)
    project_uuid: str = Column(UUID(as_uuid=False), ForeignKey("projects.uuid"), nullable=False)

    type: str = Column(String(255))
    value: str = Column(Text)

    level: str = Column(String(50))
    lineno: int | None = Column(Integer)
    start_line: int | None = Column(Integer)
    context: str | None = Column(Text)
    function: str | None = Column(String(255))
    abs_path: str | None = Column(Text)
    filename: str | None = Column(Text)

    runtime_version: str | None = Column(String(255))
    runtime_name: str | None = Column(String(255))
    runtime_build: str | None = Column(String(255))
    module: str | None = Column(String(255))
    platform: str | None = Column(String(255))
    server_name: str | None = Column(String(255))

    timestamp: datetime = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    project = relationship("Project", back_populates="events")

    def __repr__(self) -> str:
        return f"<Event uuid={self.uuid} project={self.project_uuid}>"
