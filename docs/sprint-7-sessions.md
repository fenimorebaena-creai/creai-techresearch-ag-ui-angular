# TR-306 — Compressed 7-session sprint (to demo on 2026-06-22)

> **This is the authoritative execution plan.** It supersedes the 22-day
> per-day files under `docs/days/` and the original calendar in
> `docs/research-plan.md`, which assumed a 30-day sprint starting 2026-05-25.
> The scaffold (commit `c9801b6`) already implements most of Phases 1–2, so the
> real work is **verify → polish → document → demo**, not coding from scratch.

## Why the plan changed

The calendar collapsed from 22 working days to **7 one-hour sessions** before
the demo. Availability is Tue–Fri only:

- **S1** Wed 2026-06-10
- **S2** Thu 2026-06-11
- **S3** Fri 2026-06-12
- **S4** Tue 2026-06-16
- **S5** Wed 2026-06-17
- **S6** Thu 2026-06-18
- **S7** Fri 2026-06-19
- **Buffer** Sun 2026-06-21 (optional 4h, slip catch-up only)
- **Demo** Mon 2026-06-22

Plan to ~half the calendar time (≈30 min effective/session) so reviews,
meetings and debugging have slack.

## Decisions (2026-06-10)

- **Demo format:** live `make dev` demo **+ a recorded screencast as backup**.
- **Official client:** time-boxed **spike** of `@copilotkit/angular` + the
  Angular 20 Streaming Resource API in S2, then decide adopt vs. keep the
  hand-rolled `AgentService`.
- **Slip buffer:** Sunday 2026-06-21 (4h) only if S1–S7 fall behind.
- **Port:** the mock agent runs on **:8001** (configurable via `PORT`) to avoid
  colliding with `creai_labor-relations` on :8000.

## Sessions

| #  | Day        | Focus (1h)                                                                                                                                      | Done-when                                  |
| -- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| S1 | Wed 06-10  | **Runtime green + Jira.** `make install` + `make test`, boot API, confirm SSE stream, `ng build`/`serve`. Transition TR-306, set due date.     | App runs end-to-end; ticket In Progress    |
| S2 | Thu 06-11  | **Spike official client** (`@copilotkit/angular` + Streaming Resource API), time-boxed. Decide adopt vs. hand-rolled; record the finding.       | Decision logged in `vensure-integration.md`|
| S3 | Fri 06-12  | **UX polish for demo.** Real error state, loading/typing indicator, visible abort, empty state, presentable styling.                            | UI ready to project                        |
| S4 | Tue 06-16  | **Findings — fix the baseline.** Compare AG-UI streaming vs the **real** chat transport (REST `/conversations/{id}/messages` + gRPC, see below).| `vensure-integration.md` corrected         |
| S5 | Wed 06-17  | **README + architecture + screenshots.** Quick start, mermaid, event-coverage table, captures, decision log (adopt/investigate/park).           | README presentable                         |
| S6 | Thu 06-18  | **Screencast backup (2–3 min) + live-demo runbook** with fallback steps.                                                                        | `.mp4` + demo script                       |
| S7 | Fri 06-19  | **Dry-run on a clean checkout** (fresh clone, `make dev`) to mimic the demo machine. Fix friction. Final Jira update.                            | Demo rehearsed, no surprises               |
| 🎯 | Mon 06-22  | **Live demo + screencast backup.** Then transition TR-306 → Done.                                                                               | Ticket closed                              |

## Key correction for the findings doc (from Cursor plan VN-54)

`docs/vensure-integration.md` currently compares AG-UI against the **WebSocket**
`/api/v1/ws` pattern — but that WS is for document upload/structure jobs, **not**
the chat. The real chat transport today (Cursor plan
`chat_integration_backend-frontend`, ticket VN-54) is **synchronous REST**:
`POST /api/v1/conversations/{id}/messages` in `creai_labor-relations` → gRPC to
`ai-entities-extraction` (NL2Q, :50052) + `ai-graph-relations` (Answer
Generation, :50053), returning the full `assistant_message` at once — no
streaming, no WebSocket.

→ The correct "before" baseline is **REST request/response + gRPC**, which is
what makes AG-UI's token streaming, visible tool calls and `STATE_DELTA`
compelling. VN-54 also provides real artifacts (`graph.query_interpretation`,
`graph.answer_synthesis`), the evidence panel, feedback, onboarding context, and
open TODOs (X-Tenant-Id/X-User-Id from JWT, structured evidence in the proto,
exports endpoint, applied-rules) to ground the analysis. Fix this in **S4**.
