from contextlib import asynccontextmanager
import importlib
import os
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker

from backend.services.utils.config import Config

SQLALCHEMY_DATABASE_URL = ("postgresql+asyncpg://"
                           f"{Config.DB_USER}:{Config.DB_PASSWORD}@{Config.DB_HOST}"  # noqa
                           f":{Config.DB_PORT}/{Config.DB_NAME}"
                           )  # noqa


async def cook_models():
    """
    Asynchronously imports all the models from the "tasks_shared/models" directory.

    This function iterates over all the files in the "tasks_shared/models" directory,
    excluding files with a ".py" or "__" extension.
    For each file, it imports the corresponding model by dynamically constructing
    the import path using the file name.
    """
    for pkg in os.listdir("backend/services/sqlstore/models"):
        if not pkg.endswith(".py") and not pkg.endswith("__"):
            importlib.import_module(f".{pkg}.model",
                                    package="services.sqlstore.models")


@asynccontextmanager
async def get_session():
    """
    An asynchronous context manager to get a session, handle exceptions, and clean up resources.
    """
    engine = await get_engine()
    async_session_factory = await get_session_factory(engine)

    async with async_session_factory() as db_session:
        try:
            yield db_session
        except Exception:
            await db_session.rollback()
            raise
        finally:
            await db_session.close()
            await engine.dispose()


async def get_engine():
    """
    Create and return an asynchronous database engine.

    This function initializes an asynchronous engine using the SQLALCHEMY_DATABASE_URL
    and sets the future flag to True.

    Returns:
        AsyncEngine: The initialized asynchronous database engine.
    """
    engine = create_async_engine(
        SQLALCHEMY_DATABASE_URL,
        future=True
    )
    return engine


async def get_session_factory(engine):
    """
    Create and return an asynchronous session factory for the given database engine.

    Parameters:
        engine (AsyncEngine): The database engine to bind the session factory to.

    Returns:
        AsyncSessionFactory: An asynchronous session factory that can be used to create sessions.
    """
    async_session_factory = sessionmaker(
        bind=engine,
        expire_on_commit=False,
        class_=AsyncSession
    )

    return async_session_factory
