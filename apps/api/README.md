# `apps/api` — Mock AG-UI agent (FastAPI)

A minimal FastAPI server that exposes a single `POST /agent` endpoint and streams
[AG-UI Protocol](https://github.com/ag-ui-protocol/ag-ui) events over Server-Sent
Events (SSE). It impersonates a Labor Relations assistant that answers questions
about Collective Bargaining Agreements (CBAs).

## Endpoints

- `GET  /health` — health probe
- `POST /agent`  — accepts an AG-UI `RunAgentInput` body, returns an
  `text/event-stream` of AG-UI events

## Event coverage

| Event                  | Phase | Notes                                            |
| ---------------------- | ----- | ------------------------------------------------ |
| `RUN_STARTED`          | 1     | Sent immediately after request is accepted       |
| `TEXT_MESSAGE_START`   | 2     | Opens an assistant message                       |
| `TEXT_MESSAGE_CONTENT` | 2     | Token-by-token streaming of the message body     |
| `TEXT_MESSAGE_END`     | 2     | Closes the assistant message                     |
| `TOOL_CALL_START`      | 2     | Opens a `search_cba_clause` tool invocation      |
| `TOOL_CALL_ARGS`       | 2     | Streams the tool arguments                       |
| `TOOL_CALL_END`        | 2     | Closes the tool invocation                       |
| `TOOL_CALL_RESULT`     | 2     | Carries the tool output                          |
| `STATE_DELTA`          | 2     | JSON-Patch updates to the shared context state   |
| `RUN_FINISHED`         | 3     | Sent at the end of the run                       |

## Run locally

```bash
cd apps/api
python -m venv .venv
. .venv/bin/activate
pip install -e ".[dev]"
uvicorn src.main:app --reload --port 8000
```

Verify with a curl smoke test:

```bash
curl -N -X POST http://localhost:8000/agent \
  -H 'Content-Type: application/json' \
  -H 'Accept: text/event-stream' \
  -d '{"threadId":"t1","runId":"r1","messages":[{"id":"m1","role":"user","content":"Hello"}],"tools":[],"context":[],"state":{},"forwardedProps":{}}'
```

You should see a sequence of `event: <name>` / `data: <json>` pairs.
