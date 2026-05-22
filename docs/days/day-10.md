# Day 10 — Mock search_cba_clause tool implementation

> Phase 2 · Core events and Vensure use case

## Context

By the end of day 09 the agent emits a hard-coded tool result inline in
`main.py`. Today you extract a small, realistic-looking
`search_cba_clause(query: str, top_k: int)` function with a fixed corpus of
two CBA clauses themed for the Labor Relations product.

## Objective

`main.py` calls `search_cba_clause(...)` instead of building the result inline.
The result mirrors a plausible shape from the future `ai-graph-relations`
gRPC service: a list of `{id, union, section, excerpt}` objects.

## Time budget

- Calendar: 60 min
- Effective: 30 min

## Pre-flight checklist

- [ ] Day-09 pill transitions and `Result` block working.
- [ ] Refreshing your AG-UI notes is not necessary today.

## Actions

1. **Create `apps/api/src/tools.py`**:

   ```python
   from typing import TypedDict

   class CbaClause(TypedDict):
       id: str
       union: str
       section: str
       excerpt: str

   _CORPUS: list[CbaClause] = [
       {
           "id": "cba-2024-art-12",
           "union": "Local 100 - Transit Workers",
           "section": "Article XII - Overtime Compensation",
           "excerpt": (
               "Overtime work performed in excess of forty (40) hours per week "
               "shall be compensated at one and one-half (1.5) times the regular "
               "hourly rate."
           ),
       },
       {
           "id": "cba-2024-art-18",
           "union": "Local 100 - Transit Workers",
           "section": "Article XVIII - Holiday Pay",
           "excerpt": (
               "Employees required to work on a recognized holiday shall receive "
               "double (2.0) their regular hourly rate for all hours worked on "
               "such holiday."
           ),
       },
   ]

   def search_cba_clause(query: str, *, top_k: int = 2) -> list[CbaClause]:
       """Return the first `top_k` clauses; ignore the query for now."""
       return _CORPUS[: top_k]
   ```

2. **In `main.py`** import and call the tool:

   ```python
   from src.tools import search_cba_clause

   results = search_cba_clause(query=user_text, top_k=2)
   yield format_sse_event(events.tool_call_result(
       ...,
       content={"results": results},
   ))
   ```

3. **Pull the user's last message** from `payload.messages` to pass as `query`
   (use a small helper):

   ```python
   def _last_user_message(messages: list[Message]) -> str:
       for msg in reversed(messages):
           if msg.role == "user" and msg.content:
               return msg.content
       return "Hello"
   ```

4. **Update the smoke test** in `apps/api/tests/test_agent_stream.py` to assert
   the result payload contains the expected clause IDs.

5. **Run** `pytest -q` from `apps/api/`. Expect a passing test.

## Verification

- [ ] `pytest -q` passes (1 or 2 tests).
- [ ] Manual smoke: type a message in the UI, the result JSON in the tool
      pill contains the two clauses with `cba-2024-art-12` and
      `cba-2024-art-18`.

## Output

- New: `apps/api/src/tools.py`.
- Updated: `main.py`, `test_agent_stream.py`.
- Commit: `feat(api): extract search_cba_clause tool with fixed corpus`.

## Handoff to day 11

The tool ignores the query — that is fine. Tomorrow you simulate latency and
multi-result selection so the demo feels less canned. Keep the corpus tiny
(two entries is enough for the demo).

## References

- Vensure documents domain — for shape inspiration only:
  `~/work/vensure/creai_labor-relations/app/modules/documents/`.
- Day-02 notes (tool event family).
