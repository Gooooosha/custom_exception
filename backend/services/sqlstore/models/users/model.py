from sqlalchemy import Column, Integer, String, LargeBinary
from sqlalchemy.orm import relationship

from backend.services.sqlstore.database_init import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    login = Column(String(255), unique=True, nullable=False)
    password = Column(LargeBinary, nullable=False)
    name = Column(String(255))
    role = Column(String(50))

    user_projects = relationship("UserProject", back_populates="user", cascade="all, delete-orphan")
    projects = relationship("Project", secondary="user_projects", viewonly=True)

    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)
