from datetime import datetime

from sqlalchemy import Column, ForeignKey, Integer, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from backend.services.sqlstore.database_init import Base


class UserProject(Base):
    __tablename__ = "user_projects"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    project_uuid: str = Column(UUID(as_uuid=False), ForeignKey("projects.uuid", ondelete="CASCADE"), primary_key=True)

    joined_at: datetime = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="user_projects")
    project = relationship("Project", back_populates="user_projects")

    def __repr__(self):
        return f"<UserProject user_id={self.user_id} project_uuid={self.project_uuid}>"
