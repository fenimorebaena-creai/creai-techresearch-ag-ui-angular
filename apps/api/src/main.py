"""FastAPI entrypoint exposing an AG-UI Protocol agent over SSE.

The agent is intentionally a deterministic mock: given any user message, it
streams a short answer plus a single `search_cba_clause` tool call. The goal
is to exercise the AG-UI event types from an Angular 20 client, not to call
real LLMs.
"""

from __future__ import annotations

import asyncio
import json
import uuid
from collections.abc import AsyncIterator
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from src import events
from src.events import format_sse_event

app = FastAPI(
    title="AG-UI Mock Agent",
    version="0.1.0",
    description="Minimal FastAPI agent emitting AG-UI Protocol events over SSE.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Message(BaseModel):
    id: str
    role: str
    content: str | None = None


class RunAgentInput(BaseModel):
    """Minimal AG-UI RunAgentInput. The full spec includes more fields; the
    demo only needs threadId/runId/messages."""

    threadId: str = Field(..., alias="threadId")
    runId: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="runId")
    messages: list[Message] = Field(default_factory=list)
    tools: list[dict[str, Any]] = Field(default_factory=list)
    context: list[dict[str, Any]] = Field(default_factory=list)
    state: dict[str, Any] = Field(default_factory=dict)
    forwardedProps: dict[str, Any] = Field(default_factory=dict)

    model_config = {"populate_by_name": True}


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


def _last_user_message(messages: list[Message]) -> str:
    for msg in reversed(messages):
        if msg.role == "user" and msg.content:
            return msg.content
    return "Hello"


# A tiny in-memory "knowledge base" used by the mock search tool.
_FAKE_CLAUSES: list[dict[str, str]] = [
    {
        "id": "cba-2024-art-12",
        "union": "Local 100 - Transit Workers",
        "section": "Article XII - Overtime Compensation",
        "excerpt": (
            "Overtime work performed in excess of forty (40) hours per week shall be "
            "compensated at one and one-half (1.5) times the regular hourly rate."
        ),
    },
    {
        "id": "cba-2024-art-18",
        "union": "Local 100 - Transit Workers",
        "section": "Article XVIII - Holiday Pay",
        "excerpt": (
            "Employees required to work on a recognized holiday shall receive double "
            "(2.0) their regular hourly rate for all hours worked on such holiday."
        ),
    },
]


async def _stream_run(payload: RunAgentInput) -> AsyncIterator[str]:
    thread_id = payload.threadId
    run_id = payload.runId
    user_text = _last_user_message(payload.messages)

    yield format_sse_event(events.run_started(thread_id=thread_id, run_id=run_id))

    yield format_sse_event(
        events.state_delta(
            thread_id=thread_id,
            run_id=run_id,
            patches=[{"op": "add", "path": "/lastUserMessage", "value": user_text}],
        )
    )

    message_id = f"msg-{uuid.uuid4().hex[:8]}"
    yield format_sse_event(
        events.text_message_start(thread_id=thread_id, run_id=run_id, message_id=message_id)
    )

    intro = "Let me search the relevant CBA clauses for you..."
    for chunk in _chunks(intro, size=6):
        await asyncio.sleep(0.05)
        yield format_sse_event(
            events.text_message_content(
                thread_id=thread_id, run_id=run_id, message_id=message_id, delta=chunk
            )
        )

    yield format_sse_event(
        events.text_message_end(thread_id=thread_id, run_id=run_id, message_id=message_id)
    )

    tool_call_id = f"call-{uuid.uuid4().hex[:8]}"
    yield format_sse_event(
        events.tool_call_start(
            thread_id=thread_id,
            run_id=run_id,
            tool_call_id=tool_call_id,
            tool_name="search_cba_clause",
            parent_message_id=message_id,
        )
    )

    args_json = json.dumps({"query": user_text, "topK": 2})
    for chunk in _chunks(args_json, size=10):
        await asyncio.sleep(0.03)
        yield format_sse_event(
            events.tool_call_args(
                thread_id=thread_id, run_id=run_id, tool_call_id=tool_call_id, delta=chunk
            )
        )

    yield format_sse_event(
        events.tool_call_end(thread_id=thread_id, run_id=run_id, tool_call_id=tool_call_id)
    )

    await asyncio.sleep(0.3)
    yield format_sse_event(
        events.tool_call_result(
            thread_id=thread_id,
            run_id=run_id,
            tool_call_id=tool_call_id,
            message_id=f"msg-{uuid.uuid4().hex[:8]}",
            content={"results": _FAKE_CLAUSES},
        )
    )

    yield format_sse_event(
        events.state_delta(
            thread_id=thread_id,
            run_id=run_id,
            patches=[{"op": "add", "path": "/citedClauses", "value": _FAKE_CLAUSES}],
        )
    )

    final_message_id = f"msg-{uuid.uuid4().hex[:8]}"
    yield format_sse_event(
        events.text_message_start(thread_id=thread_id, run_id=run_id, message_id=final_message_id)
    )
    final_answer = (
        "Based on the current CBA for Local 100 (Transit Workers), overtime above 40 hours "
        "per week is paid at 1.5x the regular rate, and holiday work is paid at 2.0x. "
        "I've added both clauses to the context panel on the right."
    )
    for chunk in _chunks(final_answer, size=8):
        await asyncio.sleep(0.04)
        yield format_sse_event(
            events.text_message_content(
                thread_id=thread_id,
                run_id=run_id,
                message_id=final_message_id,
                delta=chunk,
            )
        )
    yield format_sse_event(
        events.text_message_end(
            thread_id=thread_id, run_id=run_id, message_id=final_message_id
        )
    )

    yield format_sse_event(events.run_finished(thread_id=thread_id, run_id=run_id))


def _chunks(text: str, *, size: int) -> list[str]:
    return [text[i : i + size] for i in range(0, len(text), size)]


@app.post("/agent")
async def run_agent(payload: RunAgentInput) -> StreamingResponse:
    return StreamingResponse(
        _stream_run(payload),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
