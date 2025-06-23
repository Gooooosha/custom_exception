from sqlalchemy import insert, select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession


def orm_to_dict(obj):
    return {column.name: getattr(obj, column.name) for column in obj.__table__.columns}


class SQLAlchemyRepository:
    model = None

    def __init__(self, session: AsyncSession):
        self.session = session

    async def add_one(self, **data) -> int | str | None:
        # TODO не работало со старой версией
        table = self.model.__table__
        if hasattr(self.model, 'id'):
            stmt = insert(table).values(**data).returning(self.model.id)
        elif hasattr(self.model, 'uuid'):
            stmt = insert(table).values(**data).returning(self.model.uuid)
        else:
            stmt = insert(table).values(**data).returning(self.model.user_id)
        res = await self.session.execute(stmt)
        await self.session.commit()
        return res.scalar_one_or_none()

    async def update_one(self, filters: dict, data: dict) -> int | str | None:
        table = self.model.__table__
        if hasattr(self.model, 'id'):
            stmt = update(table).filter_by(**filters).values(**data).returning(self.model.id)
        else:
            stmt = update(table).filter_by(**filters).values(**data).returning(self.model.uuid)
        res = await self.session.execute(stmt)
        await self.session.commit()
        return res.scalar_one_or_none()

    async def get_one(self, **filter_by):
        stmt = select(self.model).filter_by(**filter_by).limit(1)
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def get_all(self, **filter_by):
        stmt = select(self.model).filter_by(**filter_by)
        res = await self.session.execute(stmt)
        return [orm_to_dict(row[0]) for row in res.all()]

    async def delete_one(self, **filter_by) -> int | str | None:
        table = self.model.__table__
        if hasattr(self.model, 'id'):
            stmt = delete(table).filter_by(**filter_by).returning(self.model.id)
        else:
            stmt = delete(table).filter_by(**filter_by).returning(self.model.uuid)
        res = await self.session.execute(stmt)
        await self.session.commit()
        return res.scalar_one_or_none()
