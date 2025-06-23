from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, DateTime
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.orm import declarative_mixin


def server_now() -> datetime:
    """
    Returns the current server time in UTC+3.
    """
    utc_plus_3 = timezone(timedelta(hours=3))
    return datetime.now(timezone.utc).astimezone(utc_plus_3)


@declarative_mixin
class TimestampMixin:
    @declared_attr
    def created_at(cls):
        """
        A decorator that defines the `created_at` column
        for a SQLAlchemy model.
        """
        return Column(DateTime(timezone=True), default=server_now,
                      nullable=False)

    @declared_attr
    def updated_at(cls):
        """
        A decorator that defines the `updated_at` column
        for a SQLAlchemy model.
        """
        return Column(DateTime(timezone=True), default=server_now,
                      onupdate=server_now, nullable=False)
