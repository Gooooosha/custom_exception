import gzip
import json
from datetime import datetime, timezone
from io import BytesIO
from fastapi import Request
from pydantic import ValidationError

from backend.schemas.db.event import EventDB
from backend.services.utils.logger import Logger
from backend.services.utils.uuid_creator import get_uuid

logger = Logger(__name__)


class Sentry:

    @staticmethod
    async def parse_as_json(request: Request) -> dict | None:
        compressed_data = await request.body()
        if request.headers.get("content-encoding") == "gzip":
            with gzip.GzipFile(fileobj=BytesIO(compressed_data)) as f:
                raw_data = f.read().decode('utf-8')
        else:
            raw_data = compressed_data.decode('utf-8')
        lines = raw_data.strip().split('\n')
        if not lines:
            return None
        envelope = {}
        envelope_header = json.loads(lines[0])
        envelope['envelope_headers'] = envelope_header
        items = []
        i = 1
        while i < len(lines):
            item_header = json.loads(lines[i])
            i += 1
            if i >= len(lines):
                break
            payload_line = lines[i]
            i += 1
            try:
                payload = json.loads(payload_line)
            except json.JSONDecodeError:
                payload = payload_line
            items.append({
                'item_header': item_header,
                'payload': payload
            })
        envelope['items'] = items
        return envelope

    @staticmethod
    async def parse_as_model(request: Request) -> EventDB | None:
        event_json = await Sentry.parse_as_json(request)
        if not event_json:
            return None
        try:
            envelope_headers = event_json.get("envelope_headers", {})
            first_item = event_json["items"][0]
            payload = first_item["payload"]

            exc = payload["exception"]["values"][0]
            frame = exc["stacktrace"]["frames"][0]

            pre_ctx = frame.get("pre_context", [])
            ctx_line = frame.get("context_line", "")
            post_ctx = frame.get("post_context", [])
            context = "\n".join([*pre_ctx, ctx_line, *post_ctx])

            start_line = frame.get("lineno", 0) - len(pre_ctx)

            runtime = payload.get("contexts", {}).get("runtime", {})
            rt_name, rt_ver, rt_build = (
                runtime.get("name"),
                runtime.get("version"),
                runtime.get("build"),
            )

            event_data = {
                "uuid": get_uuid(),
                "project_uuid": envelope_headers.get("trace", {}).get("public_key"),

                "context": context,
                "start_line": start_line,
                "lineno": frame.get("lineno"),

                # TODO: сделать его динамическим
                "level": "unmarked",

                "timestamp": datetime.fromisoformat(
                    payload["timestamp"].replace("Z", "+00:00")
                ).astimezone(timezone.utc),

                "type": exc.get("type"),
                "value": exc.get("value"),

                "filename": frame.get("filename"),
                "abs_path": frame.get("abs_path"),
                "function": frame.get("function"),
                "module": frame.get("module"),

                "platform": payload.get("platform"),

                "runtime_name": rt_name,
                "runtime_version": rt_ver,
                "runtime_build": rt_build,

                "server_name": payload.get("server_name"),
            }

            return EventDB(**event_data)

        except (KeyError, IndexError, TypeError, ValueError, ValidationError):
            logger.error("Error in parse_as_model")
            return None
