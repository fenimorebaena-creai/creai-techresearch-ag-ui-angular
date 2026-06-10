# Vensure integration analysis

How would AG-UI fit into the Vensure Labor Relations product, and how does it
compare to the WebSocket pattern that `creai_labor-relations` already uses for
upload and structure-extraction jobs?

## Where AG-UI would land

In `creai_labor-relations-front` (Angular 20 microfrontend), the **Chat tab** is
currently mocked. The future *Labor Relations Assistant* would need to:

- Stream the assistant's tokens as they are produced
- Surface tool calls (retrieval, graph queries) with intermediate progress
- Update a context side-panel with cited CBAs, MOAs, and clauses as the agent
  works
- Optionally support human-in-the-loop confirmations (e.g. *"Do you want me to
  consolidate this MOA into the CBA?"*)

These are exactly the affordances AG-UI standardises.

On the backend, the natural integration point is **`creai_labor-relations`**
(the FastAPI orchestrator). It already owns:

- Auth (`PyJWT`), per-request actor context
- WebSocket endpoint at `/api/v1/ws` for upload/structure events
- gRPC clients to the three `ai-*` services (structure, entities, graph)

A real AG-UI endpoint would live in a new module
(`app/modules/assistant/api/`), POST `/api/v1/assistant/agent`, and emit
events while orchestrating the existing gRPC clients.

## AG-UI vs the current WebSocket pattern

| Concern                        | AG-UI (HTTP + SSE)                                                                                                          | Current WebSocket pattern in Vensure                                                                                                                 |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Transport**                  | HTTP/1.1 or HTTP/2 + Server-Sent Events. Unidirectional server→client after the initial POST.                                | WebSocket. Bidirectional, but in practice used mostly server→client for job updates.                                                                  |
| **Auth**                       | Standard HTTP headers (`Authorization: Bearer`, cookies). Plugs into existing JWT middleware without changes.                | Not implemented (`docs/backend/08-open-questions.md`); WebSocket endpoint is currently unauthenticated. Auth would require sub-protocol or token-in-URL workaround. |
| **Reconnect / catch-up**       | Native `Last-Event-ID` header + numeric event IDs. Server can replay missed events on reconnect with minimal code.            | None; reconnection client-side starts a new stream. Catch-up of missed events would require new server-side machinery.                                |
| **Event typing**               | ~16 standardised event types. Off-the-shelf TS types from CopilotKit. Easy to adopt new event types later.                   | Ad-hoc JSON shapes per feature. No central catalogue, no shared TS types between front and back.                                                      |
| **Multi-replica scale-out**    | Each POST is a fresh HTTP request → stateless from the LB perspective. Compatible with horizontally scaled FastAPI replicas. | `ConnectionManager` is in-process; multiple replicas of `creai_labor-relations` cannot fan out updates without Redis Pub/Sub or similar.              |
| **Polyglot ecosystem**         | First-party SDKs in Python, JS, Go. Clients in React, Angular (CopilotKit), Vue, Svelte; community React Native.             | Bespoke; would need to be rebuilt or wrapped for any new client.                                                                                       |
| **Streaming primitives**       | Tokens (`TEXT_MESSAGE_CONTENT`), tool calls (`TOOL_CALL_*`), state diffs (`STATE_DELTA`), interrupts. All standardised.       | Currently scoped to "list updated" / "amendment updated" payloads for the documents module. Would need new event taxonomy for chat.                  |
| **Generative UI**              | Supported via AG-UI's tool-call → component-render pattern (CopilotKit registers client tools that the agent invokes).        | Not supported today; would require greenfield design.                                                                                                  |
| **Browser API**                | `fetch()` + `ReadableStream`. Works behind corporate proxies that block WS. No special infra.                                | `WebSocket` API. Sometimes blocked by aggressive proxies; ALB / Azure App Gateway requires explicit upgrade handling.                                  |
| **Operational cost**           | Long-lived connections, but each is just an HTTP/1.1 stream. Easy to terminate behind any standard ingress.                  | Long-lived TCP; some load balancers count WebSocket idle differently. K8s health probes must avoid killing live streams.                              |
| **Debuggability**              | Visible in DevTools → Network → EventStream tab. `curl -N` produces human-readable output.                                   | Visible in DevTools → Network → WS tab. Frames are JSON but no event-name in the wire format unless added manually.                                   |

## What AG-UI does *not* solve

- **Auth.** AG-UI relies on HTTP headers; you still need to wire JWT validation
  on the new `/api/v1/assistant/agent` endpoint and propagate the actor context
  to the agent orchestrator. The WebSocket auth gap on `/api/v1/ws` is
  unaffected and remains its own ticket.
- **Multi-replica fan-out for the *existing* document WS.** The
  upload/structure WS pattern would either keep its current shape (and add
  Redis-backed `ConnectionManager`) or be migrated separately to AG-UI.
- **Backend agent orchestration.** AG-UI is purely the wire format; the actual
  retrieval + graph + LLM pipeline still has to be built on top of the existing
  gRPC services. CopilotKit ships first-party adapters for LangGraph, CrewAI
  and Mastra that emit AG-UI natively; rolling our own emitter (as in this
  research repo) is also straightforward.
- **Reactive forms / non-chat UIs.** AG-UI is optimised for agent ↔ user
  loops. Existing CRUD screens (Reference Data, MOA amendments) should keep
  using regular REST and the in-tree WS for list refreshes.

## Client choice — spike result (2026-06-10)

**There is no first-party Angular client.** `@copilotkit/angular` and
`@ag-ui/angular` do not exist on npm (404); CopilotKit ships React-only packages
(`@copilotkit/react-core`, peer-deps `react ^18 || ^19`). The earlier assumption
of "a CopilotKit Angular client on Signals + Streaming Resource API" was wrong.

What *does* exist is the framework-agnostic **`@ag-ui/client`** (v0.0.56). Its
`HttpAgent` owns the POST + SSE transport, event-sequence verification
(`verifyEvents`) and shared-state reduction via **`fast-json-patch`**. A spike
pointed it at this repo's FastAPI mock and it reconstructed messages, the
`search_cba_clause` tool call and `state.citedClauses` (JSON-Patch) correctly
with no backend changes (see `apps/web/spike-ag-ui-client.mjs`).

**Decision:** the demo now uses `HttpAgent` as the transport; the Angular layer
is a thin signals glue in `AgentService` (mirroring the client's reduced state
and the streamed text/tool-call events). This deletes the previous ~250-line
hand-rolled SSE parser + JSON-Patch reducer. For a real Vensure integration the
same shape applies: official transport + a small custom signals layer.

## Risks and unknowns

- `@ag-ui/client` is **v0.0.56** (pre-1.0): API churn is likely through 2026, so
  pin the exact version and budget for upgrades. The hand-rolled `AgentService`
  (preserved in git history) remains a viable escape hatch if the SDK stalls.
- Adopting the SDK grows the web bundle from ~200 kB to ~450 kB raw (~95 kB
  transferred) — it pulls in `rxjs`, `fast-json-patch`, `zod` and `uuid`. For an
  already-Angular MF most of this (rxjs) is shared, so the marginal cost is
  smaller in `creai_labor-relations-front`.
- The `Resource` / `streamingResource` APIs in Angular 20 are still
  `@experimental` (June 2025 release notes); we should be ready for breaking
  changes in 20.1 / 20.2.
- SSE behind PrismHR / PrismOne's existing ALBs / WAFs is **not yet
  validated** — buffer settings such as `proxy_buffering` in nginx or the
  equivalent in Azure App Gateway can break SSE streaming. Needs a dedicated
  spike in staging before adoption.
- JSON-Patch (`STATE_DELTA`) requires a battle-tested library on the client; do
  not ship the minimal patcher in this demo to production.

## Recommendation

**Investigate further with a small, time-boxed integration spike.**

Concretely, before committing to AG-UI as the chat transport in
`creai_labor-relations-front`:

1. Stand up a `/api/v1/assistant/agent` SSE endpoint in `creai_labor-relations`
   protected by the existing JWT middleware. Emit a hard-coded "Hello world"
   stream that exercises `TEXT_MESSAGE_*` + `TOOL_CALL_*` + `STATE_DELTA`.
2. Deploy behind the staging ingress (Azure App Gateway / nginx) and confirm
   SSE buffering is disabled. **Hard blocker if not** — pick a different
   transport.
3. Add the Angular client into the real MF behind a feature flag, consuming
   from the staging endpoint. Verify B2C auth headers, MSAL token refresh, and
   single-spa lifecycle interplay.
4. Decide adopt / park based on the spike outcome.

Estimated effort for the spike: 1 sprint, 1 FE + 1 BE.

If the spike succeeds, AG-UI replaces the need to invent a chat-specific
WebSocket taxonomy and gives us a free upgrade path to generative UI and
human-in-the-loop interrupts. The existing document-job WebSocket can keep its
current contract or be migrated in a separate ticket once it gains Redis-backed
multi-replica support.
