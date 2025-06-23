from datetime import datetime

from pydantic import BaseModel


class EventDB(BaseModel):
    # TODO тот случай, если поля нет в евенте
    uuid: str
    project_uuid: str
    type: str
    value: str
    level: str
    lineno: int
    context: str
    start_line: int
    function: str
    abs_path: str
    filename: str
    runtime_version: str
    runtime_name: str
    runtime_build: str
    module: str
    platform: str
    server_name: str
    timestamp: datetime
