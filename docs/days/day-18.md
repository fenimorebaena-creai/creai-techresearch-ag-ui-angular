# Day 18 — Integration analysis: auth and reconnect

> Phase 3 · Findings, comparison and presentation

## Context

This and tomorrow are the analytical core of the research: how does AG-UI
compare to the WebSocket pattern Vensure already uses for upload and
structure-extraction jobs in `creai_labor-relations`? Today you focus on the
two operational dimensions that block the most: **auth** and
**reconnect / catch-up**.

## Objective

`docs/vensure-integration.md` has filled-in sections for:

- *Where AG-UI would land* — Chat tab in `creai_labor-relations-front`,
  `/api/v1/assistant/agent` in the FastAPI orchestrator.
- *Auth* — how AG-UI uses HTTP headers and plugs into the existing JWT middleware.
- *Reconnect / catch-up* — `Last-Event-ID` story vs the current "no
  reconnect" reality (see `~/work/vensure/docs/backend/08-open-questions.md`).

## Time budget

- Calendar: 60 min
- Effective: 30–40 min

## Pre-flight checklist

- [ ] Read 5 min in `~/work/vensure/docs/backend/08-open-questions.md`,
      sections "WebSocket auth" and "Catch-up".
- [ ] AG-UI HttpAgent docs handy: <https://docs.ag-ui.com/sdk/js/client/http-agent>.

## Actions

1. **Open `docs/vensure-integration.md`** (already drafted from session 1 —
   today is for fact-checking and extending, not writing from scratch).

2. **Where AG-UI would land**. Quote the actual files:
   - Frontend: `~/work/vensure/creai_labor-relations-front/src/app/...` chat
     module (currently mocked).
   - Backend: `~/work/vensure/creai_labor-relations/app/modules/`. Propose
     a new module `assistant/` with the SSE endpoint.

3. **Auth section**. Compare:
   - AG-UI uses standard HTTP headers. Existing `creai-vensureone-iam-angular`
     interceptor already injects `Authorization`. No changes needed
     client-side beyond a new route.
   - Current `/api/v1/ws` is unauthenticated (token sub-protocol unspecified
     in the open questions doc). AG-UI moves Vensure to the "default-secure"
     side.

4. **Reconnect section**. Document:
   - AG-UI / SSE supports `Last-Event-ID` natively when the server assigns
     numeric IDs to each event. Implementing it is ~10 lines (track a counter
     in the event builder, replay from an in-memory or Redis-backed buffer).
   - Current WebSocket pattern has no catch-up. A reconnect after a transient
     network drop **loses events**. This is already a known issue.

5. **Add a small mermaid diagram** to make the comparison concrete:

   ```mermaid
   sequenceDiagram
       participant C as Client
       participant LB as Load Balancer
       participant API as FastAPI
       Note over C,API: AG-UI happy path
       C->>API: POST /agent (Last-Event-ID: 42)
       API-->>C: SSE event 43, 44, 45 ...

       Note over C,API: WebSocket today
       C->>API: WS /api/v1/ws (no auth, no last-id)
       API-->>C: frames since now (gap silently)
   ```

6. **Commit**: `docs: integration analysis on auth and reconnect`.

## Verification

- [ ] The two dimensions (`Auth`, `Reconnect / catch-up`) cite at least one
      concrete file path on each side (Vensure backend and AG-UI docs).
- [ ] The mermaid diagram renders.
- [ ] No table — use bullets and inline references (workspace rule).

## Output

- Updated: `docs/vensure-integration.md`.
- Commit: `docs: integration analysis on auth and reconnect`.

## Handoff to day 19

Tomorrow finishes the other dimensions: multi-replica scale-out, event
typing, polyglot ecosystem, and operational cost. Keep tomorrow's writing in
the same file — do not split the analysis across multiple docs.

## References

- Vensure open questions: `~/work/vensure/docs/backend/08-open-questions.md`
- AG-UI HttpAgent: <https://docs.ag-ui.com/sdk/js/client/http-agent>
- HTML `Last-Event-ID`:
  <https://html.spec.whatwg.org/multipage/server-sent-events.html#dom-eventsource-onmessage>
