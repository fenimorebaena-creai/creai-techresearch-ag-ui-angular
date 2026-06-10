# Daily execution plans

> ⚠️ **Superseded (2026-06-10).** These 22 per-day files describe the original
> 30-day calendar (starting 2026-05-25) and no longer reflect reality. The
> authoritative plan is now [`docs/sprint-7-sessions.md`](../sprint-7-sessions.md):
> 7 one-hour sessions (Tue–Fri) to a demo on 2026-06-22. Keep these files only
> as a reference for the per-day task breakdown; follow the 7-session plan for
> execution.

One markdown per working day of the 30-day research sprint for
[TR-306](https://creai.atlassian.net/browse/TR-306). Each file is **self-contained**
so an LLM or agent picking up on day N does not need to re-read the previous N-1
files to understand state.

## Conventions

Every day file follows the same structure:

1. **Context** — what should already be done, what is the current state.
2. **Objective** — one sentence describing the goal of the day.
3. **Time budget** — calendar (60 min) vs effective (30 min) target.
4. **Pre-flight checklist** — quick sanity check before opening files.
5. **Actions** — numbered, concrete steps with file paths and commands.
6. **Verification** — how to know the day was successful.
7. **Output** — files and commits that should exist at the end.
8. **Handoff** — open threads to pick up tomorrow.
9. **References** — spec sections / repo docs to read if blocked.

## Time accounting

- 22 working days × 1 h calendar = 22 h calendar
- Effective target: 30 min/day × 22 = 11 h
- Buffer absorbs reviews, meetings, debugging surprises

## Phase overview

| Phase | Days  | Theme                                          | Effective hours |
| ----- | ----- | ---------------------------------------------- | --------------- |
| 1     | 1–5   | Setup and Hello AG-UI                          | ~2.5 h          |
| 2     | 6–15  | Core events + Vensure-themed use case          | ~5 h            |
| 3     | 16–22 | Findings, comparison and presentation          | ~3.5 h          |

## Index

### Phase 1 — Setup and Hello AG-UI

- [Day 01 — Create Jira ticket and GitHub repo](day-01.md)
- [Day 02 — Read the AG-UI specification](day-02.md)
- [Day 03 — Scaffold the FastAPI mock agent](day-03.md)
- [Day 04 — Scaffold the Angular 20 standalone client](day-04.md)
- [Day 05 — Wire the first Hello AG-UI end-to-end](day-05.md)

### Phase 2 — Core events and Vensure use case

- [Day 06 — TEXT_MESSAGE_START and CONTENT streaming](day-06.md)
- [Day 07 — TEXT_MESSAGE_END lifecycle and pending state](day-07.md)
- [Day 08 — TOOL_CALL_START and ARGS streaming](day-08.md)
- [Day 09 — TOOL_CALL_END, TOOL_CALL_RESULT and UI pill](day-09.md)
- [Day 10 — Mock search_cba_clause tool implementation](day-10.md)
- [Day 11 — Tool latency simulation and multi-result responses](day-11.md)
- [Day 12 — STATE_DELTA reducer with JSON-Patch](day-12.md)
- [Day 13 — Context panel UI driven by agentState signal](day-13.md)
- [Day 14 — Composer input, send and abort controls](day-14.md)
- [Day 15 — Error states, loading skeleton and styling polish](day-15.md)

### Phase 3 — Findings, comparison and presentation

- [Day 16 — README architecture section and mermaid diagrams](day-16.md)
- [Day 17 — Screenshots and annotated UI captures](day-17.md)
- [Day 18 — Integration analysis: auth and reconnect](day-18.md)
- [Day 19 — Integration analysis: scale, typing, ecosystem](day-19.md)
- [Day 20 — Record screencast (2–3 minutes)](day-20.md)
- [Day 21 — Buffer and last polish before the demo](day-21.md)
- [Day 22 — Team demo and Jira ticket transition](day-22.md)

## Session 1 baseline

The first planning session (this commit) bootstrapped the repo with:

- Initial commit `c9801b6` containing the full scaffold of `apps/api`, `apps/web`,
  the documentation under `docs/` and the Makefile + dev script.
- Jira ticket [TR-306](https://creai.atlassian.net/browse/TR-306) created in
  status `Backlog`, assigned, priority `Medium`.

The daily plans are written **as if starting from a clean slate**: day 01 begins
with "create the Jira ticket and the repo". When following the plan from the
current state, treat each day as a *verification + extension* checklist instead
of a from-zero walk-through.
