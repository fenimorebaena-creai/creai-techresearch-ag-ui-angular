# Day 09 — TOOL_CALL_END, TOOL_CALL_RESULT and UI pill

> Phase 2 · Core events and Vensure use case

## Context

Day 08 emits the start of a tool call and shows a running pill. Today you
close the loop: emit `TOOL_CALL_END`, then `TOOL_CALL_RESULT` carrying a
hard-coded JSON result, and let the UI transition the pill through
`running → finished → completed` with a collapsible result view.

## Objective

The tool pill goes from running (pulsing) to finished (still showing args) to
completed (showing both args and a `<details>` block with the result JSON).

## Time budget

- Calendar: 60 min
- Effective: 30 min

## Pre-flight checklist

- [ ] Day-08 pill in `running` state is visible.

## Actions

1. **In `apps/api/src/events.py`** add:

   ```python
   def tool_call_result(*, thread_id, run_id, tool_call_id, content, message_id):
       return {
           **_base(EventType.TOOL_CALL_RESULT, ...),
           "toolCallId": tool_call_id,
           "messageId": message_id,
           "content": content if isinstance(content, str) else json.dumps(content),
           "role": "tool",
       }
   ```

2. **In `apps/api/src/main.py`**, after the args chunks:

   ```python
   yield format_sse_event(events.tool_call_end(
       thread_id=thread_id, run_id=run_id, tool_call_id=tool_call_id,
   ))
   await asyncio.sleep(0.3)  # simulate work
   yield format_sse_event(events.tool_call_result(
       thread_id=thread_id, run_id=run_id, tool_call_id=tool_call_id,
       message_id=f"msg-{uuid.uuid4().hex[:8]}",
       content={"results": [{"section": "Article XII", "excerpt": "..."}]},
   ))
   ```

3. **In `ag-ui.types.ts`** add `ToolCallEndEvent` and `ToolCallResultEvent` to
   the union.

4. **In `agent.service.ts`**:

   - `TOOL_CALL_END` → patch matching tool, `status='finished'`.
   - `TOOL_CALL_RESULT` → patch matching tool, `status='completed'`, save
     `result: event.content`.

5. **In `chat.component.html`** render the result block when present:

   ```html
   @if (tool.result) {
     <details class="tool-result">
       <summary>Result</summary>
       <pre>{{ tool.result }}</pre>
     </details>
   }
   ```

6. **In `chat.component.css`** stop the pulse animation when not running:

   ```css
   .tool-pill.running { animation: pulse 1.5s infinite; }
   ```

## Verification

- [ ] After a send, the pill transitions: `running` → `finished` → `completed`.
- [ ] The collapsible `Result` block contains valid JSON.
- [ ] The pulse animation is **off** in `completed` state.
- [ ] Server `curl` shows the full event sequence with `TOOL_CALL_END` and
      `TOOL_CALL_RESULT`.

## Output

- Updated: `events.py`, `main.py`, `ag-ui.types.ts`, `agent.service.ts`,
  `chat.component.html`, `chat.component.css`.
- Commit: `feat: close tool calls with END and RESULT events`.

## Handoff to day 10

The tool result is currently hard-coded inline in `main.py`. Tomorrow you
extract a real (still mock) `search_cba_clause` function with a couple of
labour-relations-themed fake clauses and a tiny query parser.

## References

- AG-UI tool events: <https://docs.ag-ui.com/concepts/events#tool-calls>
- HTML `<details>` element:
  <https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details>
