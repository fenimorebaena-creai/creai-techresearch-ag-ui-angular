# Day 19 — Integration analysis: scale, typing, ecosystem

> Phase 3 · Findings, comparison and presentation

## Context

Day 18 covered auth and reconnect. Today closes the comparative analysis with
three remaining dimensions: **multi-replica scale-out**, **event typing**, and
**polyglot client ecosystem**. End the day with a *Recommendation* section
that states explicitly: adopt, investigate further, or park.

## Objective

`docs/vensure-integration.md` is **feature-complete** by the end of today.
The decision recommended (from session 1's drafting: *investigate further
with a small spike*) is reaffirmed or revised based on what you discovered in
days 18–19.

## Time budget

- Calendar: 60 min
- Effective: 30–40 min

## Pre-flight checklist

- [ ] Day 18 sections committed.
- [ ] You can find `ConnectionManager` in
      `~/work/vensure/creai_labor-relations/` (`rg ConnectionManager`).

## Actions

1. **Multi-replica scale-out**. Document:
   - The current `ConnectionManager` is **in-process** (a dict keyed by
     `connection_id`). Two K8s replicas would not see each other's clients.
   - AG-UI is stateless from the LB perspective: each `POST /agent` is a
     fresh request. Horizontal scaling needs nothing extra. If you need
     interrupts or human-in-the-loop later, *then* you need shared state
     (Redis Pub/Sub or signals).

2. **Event typing**. Document:
   - AG-UI ships TypeScript types in `@ag-ui/client`. We mirrored them in
     `apps/web/src/app/chat/ag-ui.types.ts` for educational value.
   - The current WS messages have ad-hoc shapes per endpoint; no central
     catalogue, no shared types between front and back. Migrating to AG-UI
     forces a shared vocabulary.

3. **Polyglot ecosystem**. Document:
   - AG-UI clients exist in JS / TS, Python, Go. Server adapters for
     LangGraph, CrewAI, Mastra. CopilotKit ships the official Angular
     client (used for production, not the manual reducer we built).
   - The current WS pattern is bespoke and would need re-implementation for
     each new client (React Native, public API consumers, etc.).

4. **Operational cost & latency**. A short bullet list:
   - HTTP/1.1 over HTTPS: same TLS handshake cost as any REST call.
     Subsequent events are byte streams.
   - SSE behind nginx or Azure App Gateway works only if `proxy_buffering`
     is disabled. Document the config snippets.
   - K8s readiness / liveness probes must allow long-lived requests. Same
     concern exists for WebSocket today.

5. **Recommendation section**. Write three short paragraphs:
   - *Adopt* — for the future Labor Relations Assistant chat: AG-UI is the
     default-secure, future-proof choice.
   - *Keep* — the existing upload/structure WebSocket may stay for now,
     migrated separately once it grows multi-replica support.
   - *Spike* — propose a one-sprint integration spike (1 FE + 1 BE) to
     validate SSE behind staging infra **before** wider adoption.

6. **Cross-link** to `docs/architecture.md` and `docs/research-plan.md` from
   the top of `vensure-integration.md`.

7. **Commit**: `docs: integration analysis on scale, typing, ecosystem`.

## Verification

- [ ] `docs/vensure-integration.md` covers six dimensions (auth, reconnect,
      scale, typing, ecosystem, operational) plus a final
      *Recommendation*.
- [ ] No markdown tables (workspace rule). Use bullets.
- [ ] Cross-links resolve when previewing on GitHub.

## Output

- Updated: `docs/vensure-integration.md`.
- Commit: `docs: integration analysis on scale, typing, ecosystem`.

## Handoff to day 20

Tomorrow you record the screencast. Plan the script tonight: empty state →
send overtime prompt → highlight pulsing dot → highlight tool pill → context
panel populates → final answer. Aim for 2:30 minutes max.

## References

- Vensure backend overview:
  `~/work/vensure/docs/backend/00-overview.md`
- AG-UI clients catalogue:
  <https://github.com/ag-ui-protocol/ag-ui#integrations>
