"""AG-UI Protocol event builders.

Reference: https://github.com/ag-ui-protocol/ag-ui / https://docs.ag-ui.com

Only the events needed for this demo are modelled:

- RUN_STARTED / RUN_FINISHED
- TEXT_MESSAGE_START / TEXT_MESSAGE_CONTENT / TEXT_MESSAGE_END
- TOOL_CALL_START / TOOL_CALL_ARGS / TOOL_CALL_END / TOOL_CALL_RESULT
- STATE_DELTA (JSON-Patch RFC 6902)

Each builder returns a dict with the AG-UI event payload. The SSE wire format
(`event: <type>\ndata: <json>\n\n`) is produced by ``format_sse_event``.
"""

from __future__ import annotations

import json
import time
from enum import StrEnum
from typing import Any


class EventType(StrEnum):
    RUN_STARTED = "RUN_STARTED"
    RUN_FINISHED = "RUN_FINISHED"
    RUN_ERROR = "RUN_ERROR"
    TEXT_MESSAGE_START = "TEXT_MESSAGE_START"
    TEXT_MESSAGE_CONTENT = "TEXT_MESSAGE_CONTENT"
    TEXT_MESSAGE_END = "TEXT_MESSAGE_END"
    TOOL_CALL_START = "TOOL_CALL_START"
    TOOL_CALL_ARGS = "TOOL_CALL_ARGS"
    TOOL_CALL_END = "TOOL_CALL_END"
    TOOL_CALL_RESULT = "TOOL_CALL_RESULT"
    STATE_SNAPSHOT = "STATE_SNAPSHOT"
    STATE_DELTA = "STATE_DELTA"


def _now_ms() -> int:
    return int(time.time() * 1000)


def _base(event_type: EventType, *, thread_id: str, run_id: str) -> dict[str, Any]:
    return {
        "type": event_type.value,
        "threadId": thread_id,
        "runId": run_id,
        "timestamp": _now_ms(),
    }


def run_started(*, thread_id: str, run_id: str) -> dict[str, Any]:
    return _base(EventType.RUN_STARTED, thread_id=thread_id, run_id=run_id)


def run_finished(*, thread_id: str, run_id: str) -> dict[str, Any]:
    return _base(EventType.RUN_FINISHED, thread_id=thread_id, run_id=run_id)


def text_message_start(
    *, thread_id: str, run_id: str, message_id: str, role: str = "assistant"
) -> dict[str, Any]:
    return {
        **_base(EventType.TEXT_MESSAGE_START, thread_id=thread_id, run_id=run_id),
        "messageId": message_id,
        "role": role,
    }


def text_message_content(
    *, thread_id: str, run_id: str, message_id: str, delta: str
) -> dict[str, Any]:
    return {
        **_base(EventType.TEXT_MESSAGE_CONTENT, thread_id=thread_id, run_id=run_id),
        "messageId": message_id,
        "delta": delta,
    }


def text_message_end(*, thread_id: str, run_id: str, message_id: str) -> dict[str, Any]:
    return {
        **_base(EventType.TEXT_MESSAGE_END, thread_id=thread_id, run_id=run_id),
        "messageId": message_id,
    }


def tool_call_start(
    *,
    thread_id: str,
    run_id: str,
    tool_call_id: str,
    tool_name: str,
    parent_message_id: str | None = None,
) -> dict[str, Any]:
    return {
        **_base(EventType.TOOL_CALL_START, thread_id=thread_id, run_id=run_id),
        "toolCallId": tool_call_id,
        "toolCallName": tool_name,
        "parentMessageId": parent_message_id,
    }


def tool_call_args(
    *, thread_id: str, run_id: str, tool_call_id: str, delta: str
) -> dict[str, Any]:
    return {
        **_base(EventType.TOOL_CALL_ARGS, thread_id=thread_id, run_id=run_id),
        "toolCallId": tool_call_id,
        "delta": delta,
    }


def tool_call_end(*, thread_id: str, run_id: str, tool_call_id: str) -> dict[str, Any]:
    return {
        **_base(EventType.TOOL_CALL_END, thread_id=thread_id, run_id=run_id),
        "toolCallId": tool_call_id,
    }


def tool_call_result(
    *, thread_id: str, run_id: str, tool_call_id: str, content: Any, message_id: str
) -> dict[str, Any]:
    return {
        **_base(EventType.TOOL_CALL_RESULT, thread_id=thread_id, run_id=run_id),
        "toolCallId": tool_call_id,
        "messageId": message_id,
        "content": content if isinstance(content, str) else json.dumps(content),
        "role": "tool",
    }


def state_delta(
    *, thread_id: str, run_id: str, patches: list[dict[str, Any]]
) -> dict[str, Any]:
    """Emit a JSON-Patch (RFC 6902) delta over the shared agent state."""
    return {
        **_base(EventType.STATE_DELTA, thread_id=thread_id, run_id=run_id),
        "delta": patches,
    }


def format_sse_event(event: dict[str, Any]) -> str:
    """Serialize an AG-UI event into a Server-Sent Events frame."""
    return f"event: {event['type']}\ndata: {json.dumps(event, ensure_ascii=False)}\n\n"
