import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    DB_HOST = os.getenv("DB_HOST")
    DB_PORT = int(os.getenv("DB_PORT"))
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_NAME = os.getenv("DB_NAME")
    ADMIN_LOGIN = os.getenv("ADMIN_LOGIN")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
    ADMIN_NAME = os.getenv("ADMIN_NAME")
    SESSION_LIFETIME = int(os.getenv("SESSION_LIFETIME"))
    SESSION_COOKIE_NAME = os.getenv("SESSION_COOKIE_NAME")
    BACKEND_PROTOCOL = os.getenv("BACKEND_PROTOCOL")
    BACKEND_HOST = os.getenv("BACKEND_HOST")
    BACKEND_PORT = int(os.getenv("BACKEND_PORT"))
