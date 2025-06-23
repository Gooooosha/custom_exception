from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import DeclarativeBase

from backend.services.sqlstore.database_session import get_engine
from importlib import import_module

from backend.services.utils.logger import Logger

logger = Logger(__name__)


class Base(AsyncAttrs, DeclarativeBase):
    pass


async def init_db() -> None:
    """
    Initializes the database by creating all tables
    defined in the Base metadata.

    This function establishes an asynchronous
    connection with the database engine and
    runs the necessary synchronization to create
    all the tables defined in the Base metadata.
    The tables are created using the `run_sync` method
    of the connection object.

    Returns:
        None
    """

    import_module("backend.services.sqlstore.models.events.model")
    import_module("backend.services.sqlstore.models.notifications.model")
    import_module("backend.services.sqlstore.models.projects.model")
    import_module("backend.services.sqlstore.models.sessions.model")
    import_module("backend.services.sqlstore.models.user_projects.model")
    import_module("backend.services.sqlstore.models.users.model")

    engine = await get_engine()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    await engine.dispose(False)
