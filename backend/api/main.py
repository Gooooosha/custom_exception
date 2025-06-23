from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routers import projects, users, auth, notifications, events
from backend.services.sqlstore.database_init import init_db
from backend.services.sqlstore.database_session import get_session
from backend.services.utils.config import Config
from backend.services.utils.logger import Logger
from contextlib import asynccontextmanager

logger = Logger(__name__)

origin = f"{Config.BACKEND_PROTOCOL}://{Config.BACKEND_HOST}:{Config.BACKEND_PORT}"
origins = [origin]


@asynccontextmanager
async def lifespan(_):
    await init_db()
    async with get_session() as db_session:
        from backend.services.sqlstore.models.users.repository import UserRepository
        from backend.services.utils.config import Config
        from backend.services.utils.hash_creator import get_password_hash

        repo = UserRepository(db_session)
        user = await repo.get_one(role="admin")
        if not user:
            user = await repo.add_one(**{
                "login": Config.ADMIN_LOGIN,
                "password": get_password_hash(Config.ADMIN_PASSWORD),
                "name": Config.ADMIN_NAME,
                "role": "admin"
            })
            logger.info(f"Admin {Config.ADMIN_NAME} with id {user} was added to DB")
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])
app.include_router(events.router, prefix="/api", tags=["events"])
