# Day 03 — Scaffold the FastAPI mock agent

> Phase 1 · Setup and Hello AG-UI

## Context

Days 01–02 done: ticket `TR-NNN` open, repo cloned, AG-UI notes captured in
`docs/notes-ag-ui.md`. Today is the first code day. You will set up the
FastAPI sub-project with a single endpoint that streams a hard-coded "Hello"
message in AG-UI format.

## Objective

End the day with `apps/api/` containing a runnable FastAPI server that exposes
`POST /agent` and emits a fixed sequence of SSE frames:
`RUN_STARTED` → `TEXT_MESSAGE_START` → 3× `TEXT_MESSAGE_CONTENT` →
`TEXT_MESSAGE_END` → `RUN_FINISHED`. **No tool calls or state deltas yet** —
those are days 8–13.

## Time budget

- Calendar: 60 min
- Effective: 30–40 min

## Pre-flight checklist

- [ ] `python3 --version` ≥ 3.12.
- [ ] You can write to `apps/api/` in the repo (just `mkdir`).
- [ ] AG-UI notes file open in a side panel.

## Actions

1. **Create the layout**:

   ```bash
   mkdir -p apps/api/src apps/api/tests
   touch apps/api/src/__init__.py apps/api/tests/__init__.py
   ```
2. **Write `apps/api/pyproject.toml`** with `fastapi`, `uvicorn[standard]`,
   `pydantic ≥ 2.9`. Include a `dev` extras group with `pytest`, `httpx`,
   `ruff`. Target Python 3.12+. (See the file already in the initial commit
   for a reference.)
3. **Write `apps/api/src/events.py`** — small module with:
   - A `StrEnum` listing event types.
   - Builder functions `run_started`, `run_finished`, `text_message_start`,
     `text_message_content`, `text_message_end`. Each returns a dict.
   - A `format_sse_event(event: dict) -> str` that produces
     `event: <type>\ndata: <json>\n\n`.

   Keep tool and state builders for day 08+.
4. **Write `apps/api/src/main.py`**:
   - FastAPI app with CORS allowing `http://localhost:4200`.
   - Pydantic model `RunAgentInput` (threadId, runId, messages, tools,
     context, state, forwardedProps).
   - `GET /health` → `{"status": "ok"}`.
   - `POST /agent` returning a `StreamingResponse` of the hardcoded sequence.
   - Use `await asyncio.sleep(0.05)` between content chunks to make the
     streaming visible.
5. **Install dependencies**:

   ```bash
   cd apps/api
   python3 -m venv .venv
   . .venv/bin/activate
   pip install -e ".[dev]"
   ```
6. **Run the server**:

   ```bash
   uvicorn src.main:app --reload --port 8000
   ```
7. **Smoke test from another terminal**:

   ```bash
   curl -N -s http://localhost:8000/health
   curl -N -X POST http://localhost:8000/agent \
     -H 'Content-Type: application/json' \
     -H 'Accept: text/event-stream' \
     -d '{"threadId":"t1","runId":"r1","messages":[],"tools":[],"context":[],"state":{},"forwardedProps":{}}'
   ```

   The second call should print roughly:

   ```text
   event: RUN_STARTED
   data: {"type":"RUN_STARTED",...}

   event: TEXT_MESSAGE_START
   ...
   event: RUN_FINISHED
   data: {"type":"RUN_FINISHED",...}
   ```

## Verification

- [ ] `curl /health` returns `{"status":"ok"}`.
- [ ] `curl POST /agent` streams the expected event sequence and ends cleanly.
- [ ] Output frames respect the SSE format (`event:` then `data:` then blank line).
- [ ] No traceback in the uvicorn log.

## Output

- New files under `apps/api/` (pyproject, two modules, virtualenv ignored).
- Commit: `feat(api): scaffold FastAPI agent with hardcoded AG-UI hello stream`.

## Handoff to day 04

Leave the venv created so you can re-activate it tomorrow with
`. apps/api/.venv/bin/activate`. Do **not** push tool/state code yet — keep
the scope tight; you will extend the agent on day 08+.

## References

- AG-UI notes from day 02: `docs/notes-ag-ui.md`
- FastAPI streaming: <https://fastapi.tiangolo.com/advanced/custom-response/#streamingresponse>
- WHATWG SSE: <https://html.spec.whatwg.org/multipage/server-sent-events.html>
