# Day 11 — Tool latency simulation and multi-result responses

> Phase 2 · Core events and Vensure use case

## Context

Day 10 introduced `search_cba_clause(...)` returning a fixed list. The demo
already streams events visually, but the tool feels instantaneous. Today you
add a controlled, deterministic latency and make the tool branch on a couple
of canned queries so the agent can answer different questions plausibly.

## Objective

After today the tool returns:

- Overtime-themed query → only the overtime clause.
- Holiday-themed query → only the holiday clause.
- Anything else → both clauses.

A ~300 ms simulated latency makes the `running` → `completed` transition
visible.

## Time budget

- Calendar: 60 min
- Effective: 30 min

## Pre-flight checklist

- [ ] Day-10 corpus and tool extraction working.
- [ ] `pytest -q` from `apps/api/` is green.

## Actions

1. **In `apps/api/src/tools.py`** branch the search:

   ```python
   import asyncio
   from collections.abc import Awaitable

   _OVERTIME_KEYWORDS = {"overtime", "ot", "hours", "40"}
   _HOLIDAY_KEYWORDS  = {"holiday", "double", "2x"}

   async def search_cba_clause(query: str, *, top_k: int = 2) -> list[CbaClause]:
       await asyncio.sleep(0.3)  # simulated retrieval latency
       q = query.lower()
       tokens = set(q.split())
       overtime = bool(tokens & _OVERTIME_KEYWORDS)
       holiday  = bool(tokens & _HOLIDAY_KEYWORDS)
       if overtime and not holiday:
           return [_CORPUS[0]]
       if holiday and not overtime:
           return [_CORPUS[1]]
       return _CORPUS[: top_k]
   ```

2. **Update `main.py`** to `await` the tool:

   ```python
   results = await search_cba_clause(query=user_text, top_k=2)
   ```

3. **Update the test** to cover the three branches: assert
   `len(results) == 1` for "overtime hours" and `== 1` for "holiday" and
   `== 2` for a generic query.

4. **Manual smoke** in the browser: type
   *"What is the overtime rate?"* → one clause.
   Type *"What about working on a holiday?"* → one clause.
   Type *"Tell me everything"* → two clauses.

## Verification

- [ ] `pytest -q` covers the three branches and is green.
- [ ] In the UI, the pill stays in `running` long enough to be visible.
- [ ] Different prompts produce different `Result` JSON payloads.

## Output

- Updated: `tools.py`, `main.py`, `test_agent_stream.py`.
- Commit: `feat(api): simulate latency and branch tool results by query`.

## Handoff to day 12

Tomorrow you start `STATE_DELTA`. The plan is to push the clauses the tool
returned into a shared `agentState.citedClauses` array via JSON-Patch, so the
context panel on day 13 can render them.

## References

- AG-UI events index:
  <https://docs.ag-ui.com/concepts/events>
- Python `asyncio.sleep`:
  <https://docs.python.org/3/library/asyncio-task.html#sleeping>
