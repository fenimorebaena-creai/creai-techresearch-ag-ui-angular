# Vensure integration analysis

How would AG-UI fit into the Vensure Labor Relations product, and how does it
compare to the transport the **Labor Relations Chat** uses *today*?

> **Baseline correction (2026-06-12).** An earlier draft of this document
> compared AG-UI against the WebSocket endpoint `/api/v1/ws`. That was the wrong
> baseline: `/api/v1/ws` carries **document upload / structure-extraction job
> updates**, not the chat. The chat that shipped in **VN-54** (Cursor plan
> `chat_integration_backend-frontend`) is a **synchronous REST request/response
> backed by gRPC** — no streaming, no WebSocket. The comparison below is now
> against that real baseline, which is what makes AG-UI's token streaming,
> visible tool calls and incremental `STATE_DELTA` compelling.

## The real chat baseline today (VN-54)

The chat in `creai_labor-relations-front` calls a single blocking endpoint and
waits for the whole answer:

```
ChatPageComponent
  └─ ConversationsService.sendMessage(id, content)
       └─ POST /api/v1/conversations/{id}/messages        (FastAPI, synchronous)
            ├─ gRPC NaturalLanguageToQuery(query_text)     ai-entities-extraction :50052  → QueryRepresentation
            └─ gRPC AnswerGeneration(query_representation)  ai-graph-relations      :50053  → { answer, query (Cypher), failure_mode }
       ◀── SendMessageResponse  { user_message, assistant_message, artifacts[] }   (one shot, at the end)
```

Key properties of the baseline:

- **One request, one response.** The browser issues `POST .../messages` and
  blocks until the orchestrator has finished both gRPC round-trips. There is no
  intermediate output — the user sees a spinner, then the full answer appears at
  once. The previous mock used `setTimeout` + a sample Q&A bank; VN-54 replaced
  it with exactly one synchronous `sendMessage`.
- **Artifacts arrive bundled at the end.** The response carries
  `MessageArtifactDto[]` with two kinds:
  `graph.query_interpretation` (how the question was parsed into a query intent)
  and `graph.answer_synthesis` (`{ query, answer, failure_mode }`). These are
  *exactly* the intermediate steps AG-UI would surface live as tool calls /
  state, but today they are only visible after everything completes.
- **Evidence panel is a placeholder.** `artifactToEvidence()` returns `[]`
  unless `kind === 'graph.answer_synthesis'`, because the Answer Generation proto
  does not yet expose structured evidence (open TODO — see below).
- **Onboarding context** (`union`, `local`, `state`, `role`, `topic`,
  `effectiveDate`) is POSTed once at `create()` time and stored on the
  conversation; it is not re-streamed or updated as the agent works.
- **Feedback** is a separate `POST /conversations/{id}/feedback` keyed by the
  assistant `message_id`.

## Where AG-UI would land

In `creai_labor-relations-front` (Angular 20 microfrontend), the *Labor
Relations Assistant* chat would benefit from:

- Streaming the assistant's tokens as they are produced, instead of one blocking
  wait for the full `assistant_message`.
- Surfacing the two gRPC steps (`graph.query_interpretation`,
  `graph.answer_synthesis`) as **live tool calls** with running → completed
  status, instead of bundling them into the final response.
- Updating a context side-panel (cited CBAs, MOAs, clauses) **incrementally** as
  evidence is found, instead of a one-shot `artifacts[]` payload.
- Optionally supporting human-in-the-loop confirmations (e.g. *"Do you want me to
  consolidate this MOA into the CBA?"*).

These are exactly the affordances AG-UI standardises.

On the backend, the natural integration point is **`creai_labor-relations`**
(the FastAPI orchestrator). It already owns:

- Auth (`PyJWT`), per-request actor context
- The `conversations` module and its two gRPC clients
  (`GrpcQueryInterpretationAdapter` → :50052, `GrpcAnswerSynthesisAdapter` →
  :50053)

An AG-UI endpoint would live alongside the existing module
(e.g. `POST /api/v1/conversations/{id}/messages/stream`, or a new
`/api/v1/assistant/agent`) and **emit events while orchestrating the same gRPC
clients** — the pipeline does not change, only the wire format does.

## AG-UI vs the current REST + gRPC chat

| Concern                       | AG-UI (HTTP POST + SSE stream)                                                                                              | Current chat today (synchronous REST + gRPC, VN-54)                                                                          |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Response delivery**         | Tokens stream as produced (`TEXT_MESSAGE_CONTENT`); first token in ms, perceived latency low.                               | Single blocking `POST .../messages`; the user waits for both gRPC round-trips, then the full `assistant_message` appears.     |
| **Intermediate steps**        | The two gRPC stages surface live as `TOOL_CALL_*` (running → result), so the user sees "interpreting query…", "searching…". | `graph.query_interpretation` + `graph.answer_synthesis` are bundled into the final `artifacts[]`; no live progress.           |
| **Context / evidence panel**  | Cited clauses stream in via `STATE_DELTA` (JSON-Patch) as evidence is found.                                                | `artifacts[]` delivered once at the end; evidence panel is currently a placeholder (`[]` until the proto exposes evidence).   |
| **Perceived performance**     | Streaming masks multi-second LLM + graph latency; UI feels responsive.                                                      | Full latency is a dead spinner; long graph/LLM calls feel like a hang.                                                       |
| **Cancellation**              | Native — client aborts the `fetch`/SSE stream; server stops emitting. Visible "Stop" in the demo.                           | No cancel; the request runs to completion server-side regardless of the user.                                                |
| **Human-in-the-loop**         | First-class via interrupt events (agent pauses, asks, resumes).                                                             | Not possible in a single request/response; would need a new endpoint + state machine.                                        |
| **Event typing**              | ~16 standardised event types with off-the-shelf TS types (`@ag-ui/core`).                                                   | Typed DTOs (`SendMessageResponse`, `MessageArtifactDto`) but no event taxonomy — there are no intermediate events to type.    |
| **Auth**                      | Standard HTTP headers (`Authorization: Bearer`). Plugs into the existing JWT middleware unchanged.                          | Same — already JWT-protected REST. (Open TODO: real `X-Tenant-Id`/`X-User-Id` from the JWT; today falls back to dev defaults.)|
| **Reconnect / catch-up**      | Native `Last-Event-ID` + numeric event IDs; server can replay missed tokens.                                               | N/A — a dropped request is just retried from scratch; no partial state to recover.                                           |
| **Multi-replica scale-out**   | Each POST is a fresh stateless HTTP request → fine behind horizontally scaled FastAPI replicas.                            | Already stateless request/response → also scales fine. (No regression here — this is *not* a reason to adopt AG-UI.)         |
| **Browser API**               | `fetch()` + `ReadableStream`. Works behind corporate proxies that block WS; but **SSE buffering must be off** at the proxy. | Plain `HttpClient` request/response. Maximally proxy-friendly; nothing to validate.                                          |
| **Debuggability**             | DevTools → Network → EventStream; `curl -N` is human-readable.                                                             | DevTools → Network → one request with a JSON body. Simplest possible to inspect.                                             |
| **Implementation cost**       | New streaming endpoint + event emitter + client transport; AG-UI standardises the contract but the pipeline is rebuilt.    | Already shipped. Adopting AG-UI is net-new work justified by UX, not by fixing a broken baseline.                            |

**Bottom line:** the current chat is *correct and simple* but *opaque and
blocking*. AG-UI's value here is **experience** — streaming text, visible tool
progress, incremental evidence, cancellation and HITL — not fixing a
transport defect. The honest framing for stakeholders is "AG-UI upgrades a
working synchronous chat into a streaming agentic one," not "AG-UI replaces a
broken WebSocket."

## A note on the WebSocket pattern (`/api/v1/ws`)

`creai_labor-relations` does expose a WebSocket at `/api/v1/ws`, but it carries
**document upload / structure-extraction job updates** ("list updated",
"amendment updated"), not chat. It is a separate concern with its own
trade-offs (in-process `ConnectionManager`, no auth on the endpoint, no
multi-replica fan-out without Redis Pub/Sub). It is **not** the chat baseline and
is out of scope for the chat-transport decision. If it ever needs streaming
fan-out at scale that is its own ticket; it could keep its current contract or be
migrated to AG-UI separately.

## What AG-UI does *not* solve

- **The backend agent pipeline.** AG-UI is purely the wire format; the
  NL2Q → Answer Generation gRPC pipeline (and any future retrieval/LLM steps)
  still has to be orchestrated. AG-UI just standardises how its progress reaches
  the browser. CopilotKit ships first-party adapters for LangGraph, CrewAI and
  Mastra that emit AG-UI natively; rolling our own emitter over the existing gRPC
  clients (as in this research repo) is also straightforward.
- **Structured evidence.** The evidence panel stays empty until the Answer
  Generation proto exposes structured evidence (open VN-54 TODO). AG-UI would
  *stream* whatever evidence exists, but it cannot invent evidence the proto does
  not return.
- **Auth/tenancy hardening.** The `X-Tenant-Id` / `X-User-Id`-from-JWT TODO and
  the dev-default fallback are unchanged by the transport choice.
- **Reactive forms / non-chat UIs.** AG-UI is optimised for agent ↔ user loops.
  Existing CRUD screens (Reference Data, MOA amendments) and the document-job WS
  should keep their current contracts.

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
- **SSE behind PrismHR / PrismOne's existing ALBs / WAFs is not yet validated.**
  Buffer settings such as `proxy_buffering` in nginx or the equivalent in Azure
  App Gateway can break SSE streaming. This is the **hard blocker** to clear
  before adoption — the current synchronous REST chat does not have this risk,
  so it is a cost AG-UI introduces.
- JSON-Patch (`STATE_DELTA`) requires a battle-tested library on the client; do
  not ship the minimal patcher in this demo to production.

## Recommendation

**Investigate further with a small, time-boxed integration spike** — AG-UI is a
UX upgrade to a working chat, so the decision hinges on the streaming
infrastructure validating in staging, not on fixing a defect.

Concretely, before committing to AG-UI as the chat transport in
`creai_labor-relations-front`:

1. Stand up a streaming variant of the message endpoint in `creai_labor-relations`
   (e.g. `POST /api/v1/conversations/{id}/messages/stream`) protected by the
   existing JWT middleware. Emit `TEXT_MESSAGE_*` for the answer,
   `TOOL_CALL_*` for the NL2Q + Answer Generation stages, and `STATE_DELTA` for
   evidence — orchestrating the **same** gRPC clients the synchronous endpoint
   already uses.
2. Deploy behind the staging ingress (Azure App Gateway / nginx) and confirm SSE
   buffering is disabled. **Hard blocker if not** — keep the synchronous REST
   chat and pick a different transport.
3. Add the Angular client into the real MF behind a feature flag, consuming from
   the staging endpoint. Verify B2C auth headers, MSAL token refresh, and
   single-spa lifecycle interplay. Keep the synchronous `sendMessage` path as the
   fallback.
4. Decide adopt / park based on the spike outcome.

Estimated effort for the spike: 1 sprint, 1 FE + 1 BE.

If the spike succeeds, AG-UI turns the existing blocking chat into a streaming,
tool-aware, interruptible one and gives a free upgrade path to generative UI and
human-in-the-loop. If SSE cannot pass the staging ingress, the synchronous REST
chat stays as-is and we revisit later. The document-job WebSocket is unaffected
either way.
