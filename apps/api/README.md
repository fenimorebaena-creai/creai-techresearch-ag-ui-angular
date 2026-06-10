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
python3 -m venv .venv
. .venv/bin/activate
pip install -e ".[dev]"
uvicorn src.main:app --reload --port 8001
```

Verify with a curl smoke test:

```bash
curl -N -X POST http://localhost:8001/agent \
  -H 'Content-Type: application/json' \
  -H 'Accept: text/event-stream' \
  -d '{"threadId":"t1","runId":"r1","messages":[{"id":"m1","role":"user","content":"Hello"}],"tools":[],"context":[],"state":{},"forwardedProps":{}}'
```

You should see a sequence of `event: <name>` / `data: <json>` pairs.

## Responses

By default the agent is deterministic: `src/responses.py` routes each message to a
Labor-Relations intent by keyword (overtime, holiday, seniority, grievance,
leave) and picks a randomly-varied intro/answer plus the CBA clauses to cite, so
repeating a question does not return identical text.

Optionally, the **final answer** can be streamed from a small local LLM via
[Ollama](https://ollama.com). It is off by default and falls back to the pool if
Ollama is unreachable, so the demo never hard-fails:

```bash
ollama pull llama3.2:1b          # once
USE_LLM=1 uvicorn src.main:app --reload --port 8001
```

Env: `USE_LLM` (default off), `OLLAMA_URL` (default `http://localhost:11434`),
`OLLAMA_MODEL` (default `llama3.2:1b`). The `RUN_*`, `TOOL_CALL_*` and
`STATE_DELTA` events stay deterministic regardless of the answer source.
