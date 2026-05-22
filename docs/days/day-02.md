# Day 02 — Read the AG-UI specification

> Phase 1 · Setup and Hello AG-UI

## Context

Day 01 created `TR-NNN` and the empty repo. Before writing any code on day 03
you need to internalise the wire format. AG-UI defines about 16 standardised
event types over HTTP + SSE; this demo only needs ~10 of them. Today is a
**reading day** — the only artefact is a notes file.

## Objective

End the day able to answer:

- What goes inside `RunAgentInput`?
- What is the JSON shape of `TEXT_MESSAGE_CONTENT`?
- How does `TOOL_CALL_START` / `ARGS` / `END` / `RESULT` relate?
- What does a `STATE_DELTA` carry (hint: RFC 6902)?
- How does an AG-UI client authenticate against the server?

## Time budget

- Calendar: 60 min
- Effective: 30 min focused reading

## Pre-flight checklist

- [ ] Browser tab open on the AG-UI docs.
- [ ] Local repo cloned, README in place.

## Actions

1. **Read the protocol overview** at
   <https://docs.ag-ui.com/concepts/architecture>. ~10 min.
2. **Read the event reference** at
   <https://docs.ag-ui.com/concepts/events>. Focus on:
   - Lifecycle: `RUN_STARTED`, `RUN_FINISHED`, `RUN_ERROR`.
   - Text: `TEXT_MESSAGE_START`, `TEXT_MESSAGE_CONTENT`, `TEXT_MESSAGE_END`.
   - Tool: `TOOL_CALL_START`, `TOOL_CALL_ARGS`, `TOOL_CALL_END`,
     `TOOL_CALL_RESULT`.
   - State: `STATE_SNAPSHOT`, `STATE_DELTA`.

   Skip for now: `MESSAGES_SNAPSHOT`, `RAW`, `CUSTOM`, interrupts. ~15 min.
3. **Read the HTTP transport docs** at
   <https://docs.ag-ui.com/sdk/js/client/http-agent>. Note that AG-UI uses
   `POST + text/event-stream` (not `EventSource` over `GET`). ~5 min.
4. **Create `docs/notes-ag-ui.md`** with the structure below (template).

## Notes template

```markdown
# AG-UI quick reference

## RunAgentInput shape

(paste the relevant TS interface or JSON sample here)

## Events we will emit

| Event                  | Required fields | Sample payload   |
| ---------------------- | --------------- | ---------------- |
| RUN_STARTED            | type, threadId, runId | { ... }    |
| TEXT_MESSAGE_START     | messageId, role | { ... }          |
| ...                    | ...             | ...              |

## Auth

(How does the spec say to authenticate? Headers? Cookies? Token in body?)

## SSE wire format reminder

event: <event-name>
data: <json>
<blank line>

## Open questions (carry to day 18 — integration analysis)

- ...
```

## Verification

- [ ] File `docs/notes-ag-ui.md` exists.
- [ ] At least one JSON sample for each event family (text, tool, state).
- [ ] Auth section answered (even if "uses HTTP headers, no protocol-level auth").

## Output

- New file: `docs/notes-ag-ui.md` (a few hundred bytes).
- Commit: `docs: add AG-UI quick reference notes`.

## Handoff to day 03

Tomorrow you start the FastAPI scaffold. Pin the `RUN_STARTED`,
`TEXT_MESSAGE_START`, `TEXT_MESSAGE_CONTENT`, `TEXT_MESSAGE_END` and
`RUN_FINISHED` JSON samples from your notes — those are the only events day 03
needs.

## References

- AG-UI docs: <https://docs.ag-ui.com>
- GitHub: <https://github.com/ag-ui-protocol/ag-ui>
- WHATWG SSE spec: <https://html.spec.whatwg.org/multipage/server-sent-events.html>
