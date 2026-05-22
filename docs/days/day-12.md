# Day 12 — STATE_DELTA reducer with JSON-Patch

> Phase 2 · Core events and Vensure use case

## Context

Tool results currently land only inside the tool pill `Result` block. To
exercise the third AG-UI primitive — shared agent state via `STATE_DELTA` —
you'll push the tool's results into a shared `agentState` signal using
RFC 6902 JSON-Patch operations. The UI side comes tomorrow.

## Objective

End the day with:

- Server emitting a `STATE_DELTA` carrying `[{op:'add', path:'/citedClauses',
  value:[...]}]` right after `TOOL_CALL_RESULT`.
- Client reducer applying it, updating an `agentState` signal.

## Time budget

- Calendar: 60 min
- Effective: 30 min

## Pre-flight checklist

- [ ] Day 11 query branching working.
- [ ] `agentState()` returns `{}` today.

## Actions

1. **In `apps/api/src/events.py`** add:

   ```python
   def state_delta(*, thread_id, run_id, patches: list[dict]) -> dict:
       return {
           **_base(EventType.STATE_DELTA, thread_id=thread_id, run_id=run_id),
           "delta": patches,
       }
   ```

2. **In `apps/api/src/main.py`** emit *two* state deltas around the tool call:

   ```python
   # Right after RUN_STARTED:
   yield format_sse_event(events.state_delta(
       thread_id=thread_id, run_id=run_id,
       patches=[{"op": "add", "path": "/lastUserMessage", "value": user_text}],
   ))

   # Right after TOOL_CALL_RESULT:
   yield format_sse_event(events.state_delta(
       thread_id=thread_id, run_id=run_id,
       patches=[{"op": "add", "path": "/citedClauses", "value": results}],
   ))
   ```

3. **In `apps/web/src/app/chat/ag-ui.types.ts`** add `StateDeltaEvent` and a
   minimal `JsonPatchOperation` interface.

4. **In `agent.service.ts`**:

   ```typescript
   private readonly _agentState = signal<Record<string, unknown>>({});
   readonly agentState = this._agentState.asReadonly();
   ```

   Implement a tiny `applyJsonPatch` that supports only top-level `add`,
   `replace`, `remove` (you can paste the helper from the initial commit's
   `agent.service.ts`).

   ```typescript
   case 'STATE_DELTA':
     this._agentState.update((state) => applyJsonPatch(state, event.delta));
     break;
   ```

5. **Inspect via DevTools**: in the browser console after a send run

   ```js
   ng.applyChanges?.() // optional zoneless flush
   ```

   then expand the chat component instance and read `agentState()`. Confirm
   `lastUserMessage` and `citedClauses` are populated.

6. *(Optional)* For production-grade JSON-Patch later, swap the helper for
   `fast-json-patch`. Do **not** install today — keep the dep list small.

## Verification

- [ ] Browser DevTools shows the populated agent state after a send.
- [ ] No console error parsing the new event.
- [ ] Server `curl` shows two `STATE_DELTA` frames in the stream.

## Output

- Updated: `events.py`, `main.py`, `ag-ui.types.ts`, `agent.service.ts`.
- Commit: `feat: emit and reduce STATE_DELTA with JSON-Patch`.

## Handoff to day 13

The state exists but is invisible. Tomorrow you build the right-hand context
panel rendering `citedClauses` as cards. Resist the temptation to render
inside the chat bubbles — keeping the panel separate maps cleanly to
"generative UI" for later.

## References

- RFC 6902 (JSON Patch): <https://www.rfc-editor.org/rfc/rfc6902>
- AG-UI state events:
  <https://docs.ag-ui.com/concepts/events#state>
- Reference: `apps/web/src/app/chat/agent.service.ts` `applyJsonPatch` helper.
