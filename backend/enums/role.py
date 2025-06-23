from enum import Enum


class Role(str, Enum):
    user = "user"
    project_manager = "project_manager"
    admin = "admin"
