from sqlalchemy import Column, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from backend.services.sqlstore.database_init import Base


class Project(Base):
    __tablename__ = "projects"

    uuid: str = Column(UUID(as_uuid=False), primary_key=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    user_projects = relationship("UserProject", back_populates="project", cascade="all, delete-orphan",
                                 passive_deletes=True)
    users = relationship("User", secondary="user_projects", viewonly=True)

    events = relationship("Event", back_populates="project", cascade="all, delete-orphan")

    notifications = relationship("Notification", back_populates="project", cascade="all, delete-orphan")
