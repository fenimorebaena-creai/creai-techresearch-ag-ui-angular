"""Optional small-LLM path via Ollama.

Disabled by default. Set ``USE_LLM=1`` to stream the final answer from a local
Ollama model instead of the canned response pool. If Ollama is unreachable or
errors, the caller falls back to the pool, so the demo never hard-fails.

Env:
- ``USE_LLM``      truthy to enable (default off)
- ``OLLAMA_URL``   default http://localhost:11434
- ``OLLAMA_MODEL`` default llama3.2:1b
"""

from __future__ import annotations

import json
import os
from collections.abc import AsyncIterator

import httpx

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.2:1b")


def llm_enabled() -> bool:
    return os.environ.get("USE_LLM", "").strip().lower() in {"1", "true", "yes", "on"}


async def ollama_available(timeout: float = 0.6) -> bool:
    """Cheap reachability probe so we can fall back before emitting anything."""
    if not llm_enabled():
        return False
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.get(f"{OLLAMA_URL}/api/tags")
            return resp.status_code == 200
    except Exception:
        return False


async def stream_chat(system: str, user: str) -> AsyncIterator[str]:
    """Yield content tokens from Ollama's /api/chat NDJSON stream."""
    payload = {
        "model": OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "stream": True,
        "options": {"temperature": 0.6},
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        async with client.stream("POST", f"{OLLAMA_URL}/api/chat", json=payload) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if not line.strip():
                    continue
                obj = json.loads(line)
                token = obj.get("message", {}).get("content", "")
                if token:
                    yield token
                if obj.get("done"):
                    break
