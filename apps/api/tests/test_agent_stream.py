"""Smoke tests for the AG-UI mock agent."""

from __future__ import annotations

import json

import pytest
from httpx import ASGITransport, AsyncClient

from src.main import app


@pytest.mark.asyncio
async def test_health() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_agent_stream_emits_expected_event_sequence() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "threadId": "t-test",
            "runId": "r-test",
            "messages": [{"id": "u1", "role": "user", "content": "What is the OT rate?"}],
        }
        async with client.stream("POST", "/agent", json=payload) as response:
            assert response.status_code == 200
            assert response.headers["content-type"].startswith("text/event-stream")
            event_types: list[str] = []
            async for line in response.aiter_lines():
                if line.startswith("event: "):
                    event_types.append(line.removeprefix("event: ").strip())
                elif line.startswith("data: "):
                    json.loads(line.removeprefix("data: "))

    assert event_types[0] == "RUN_STARTED"
    assert event_types[-1] == "RUN_FINISHED"
    assert "TEXT_MESSAGE_START" in event_types
    assert "TEXT_MESSAGE_CONTENT" in event_types
    assert "TEXT_MESSAGE_END" in event_types
    assert "TOOL_CALL_START" in event_types
    assert "TOOL_CALL_ARGS" in event_types
    assert "TOOL_CALL_END" in event_types
    assert "TOOL_CALL_RESULT" in event_types
    assert "STATE_DELTA" in event_types
