# Day 08 — TOOL_CALL_START and ARGS streaming

> Phase 2 · Core events and Vensure use case

## Context

The text family is solid (days 06–07). Today you teach the **server** to emit
its first tool call event (no real tool yet — that lands on day 10), and you
teach the **client** to display "Tool X is running…" with the streaming JSON
arguments visible underneath.

## Objective

After today, `POST /agent` emits — after the text message — a
`TOOL_CALL_START` event followed by several `TOOL_CALL_ARGS` deltas containing
the JSON for a fake `search_cba_clause` invocation. The client shows a tool
pill with the streamed args. `TOOL_CALL_END` arrives on day 09.

## Time budget

- Calendar: 60 min
- Effective: 30–40 min

## Pre-flight checklist

- [ ] Days 06–07 working.
- [ ] You remember which JSON shape `TOOL_CALL_START` uses (check
      `docs/notes-ag-ui.md`).

## Actions

1. **In `apps/api/src/events.py`** add three builders:

   ```python
   def tool_call_start(*, thread_id, run_id, tool_call_id, tool_name,
                       parent_message_id=None): ...
   def tool_call_args(*, thread_id, run_id, tool_call_id, delta): ...
   def tool_call_end(*, thread_id, run_id, tool_call_id): ...
   ```

   Match the fields from the spec: `toolCallId`, `toolCallName`,
   `parentMessageId`, `delta`.

2. **In `apps/api/src/main.py`**, after the text message ends, emit:

   ```python
   tool_call_id = f"call-{uuid.uuid4().hex[:8]}"
   yield format_sse_event(events.tool_call_start(
       thread_id=thread_id, run_id=run_id, tool_call_id=tool_call_id,
       tool_name="search_cba_clause", parent_message_id=message_id,
   ))
   args_json = json.dumps({"query": "overtime rate", "topK": 2})
   for chunk in [args_json[i:i+10] for i in range(0, len(args_json), 10)]:
       await asyncio.sleep(0.03)
       yield format_sse_event(events.tool_call_args(
           thread_id=thread_id, run_id=run_id, tool_call_id=tool_call_id,
           delta=chunk,
       ))
   ```

3. **In `apps/web/src/app/chat/ag-ui.types.ts`** extend the union with
   `ToolCallStartEvent` and `ToolCallArgsEvent`, plus a `ToolCall` interface:

   ```typescript
   export interface ToolCall {
     id: string;
     name: string;
     args: string;
     status: 'running' | 'finished' | 'completed';
     result?: string;
   }
   ```

4. **In `agent.service.ts`** add:

   ```typescript
   private readonly _toolCalls = signal<Record<string, ToolCall>>({});
   readonly toolCalls = this._toolCalls.asReadonly();
   ```

   - `TOOL_CALL_START` → insert with `status='running'`, `args=''`.
   - `TOOL_CALL_ARGS` → append `delta` to the matching `args` string.

5. **In `chat.component.html`** render tool pills under the messages:

   ```html
   @for (tool of toolCallsList(); track trackTool($index, tool)) {
     <article class="tool-pill" [class.running]="tool.status === 'running'">
       <header>
         <span class="tool-name">{{ tool.name }}</span>
         <span class="tool-status">{{ tool.status }}</span>
       </header>
       @if (tool.args) {
         <pre class="tool-args">{{ tool.args }}</pre>
       }
     </article>
   }
   ```

   `toolCallsList = computed(() => Object.values(this.agent.toolCalls()))`.

6. **Smoke test**: click the button. Expected sequence in the UI:
   user bubble → assistant bubble (streaming) → tool pill with streaming
   `{"query": "overtime rate", "topK": 2}` → pill still says `running`.

## Verification

- [ ] Server `curl` shows the new `TOOL_CALL_START` and `TOOL_CALL_ARGS`
      frames.
- [ ] UI shows a yellow-bordered pill labelled `search_cba_clause`.
- [ ] The JSON args under the pill grow chunk by chunk as the events arrive.
- [ ] The pill stays in `running` state — that is expected today; day 09
      flips it.

## Output

- Updated: `events.py`, `main.py`, `ag-ui.types.ts`, `agent.service.ts`,
  `chat.component.html`, `chat.component.css`.
- Commit: `feat: emit TOOL_CALL_START and ARGS, render tool pill in UI`.

## Handoff to day 09

Tomorrow you close the tool call with `TOOL_CALL_END` and `TOOL_CALL_RESULT`,
producing the final pill state. The "running" CSS animation introduced today
should automatically stop once the day-09 status transitions land.

## References

- AG-UI tool events:
  <https://docs.ag-ui.com/concepts/events#tool-calls>
- Day-02 notes file.
