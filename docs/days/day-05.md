# Day 05 — Wire the first Hello AG-UI end-to-end

> Phase 1 · Setup and Hello AG-UI · **Phase 1 closing day**

## Context

The FastAPI agent (day 03) emits a fixed AG-UI sequence over SSE, and the
Angular client (day 04) can POST to it and log events. Today you bridge the
two and **show the streamed text in the DOM**, not just the console. This is
the "Hello AG-UI" acceptance milestone for phase 1.

## Objective

End the day with a single visible streaming message in the browser. The
`AgentService` exposes a `messages` signal containing one element whose
`content` grows token by token as `TEXT_MESSAGE_CONTENT` events arrive.

## Time budget

- Calendar: 60 min
- Effective: 30 min

## Pre-flight checklist

- [ ] `uvicorn` on `:8000` runs and `curl` against `/agent` still streams the
      fixed sequence.
- [ ] `npm start` on `:4200` compiles without errors.

## Actions

1. **In `agent.service.ts`**: replace the `console.log` debug with two signals:

   ```typescript
   private readonly _messages = signal<{ id: string; content: string }[]>([]);
   readonly messages = this._messages.asReadonly();
   ```

   Then, on each event:

   - `TEXT_MESSAGE_START` → append `{ id: event.messageId, content: '' }`.
   - `TEXT_MESSAGE_CONTENT` → update the matching entry by appending
     `event.delta` to its `content`.
   - `TEXT_MESSAGE_END` → no-op for now (you will add a `pending` flag on
     day 07).
   - Other events → still `console.log` so you can sanity-check the stream.

2. **In `AppComponent`** (or extract a `ChatComponent` already today — your
   choice): render the messages signal.

   ```typescript
   @Component({
     selector: 'app-root',
     standalone: true,
     changeDetection: ChangeDetectionStrategy.OnPush,
     template: `
       <button (click)="send()">Send hello</button>
       @for (m of agent.messages(); track m.id) {
         <p>{{ m.content }}</p>
       }
     `,
   })
   ```

3. **Run both servers** and click the button.

4. Confirm the text appears **incrementally** (the assistant message grows
   chunk by chunk). If it appears all at once, your SSE parser may be reading
   the whole stream in one `read()`; double-check the `while ((idx =
   buffer.indexOf('\n\n')) !== -1)` loop.

## Verification

- [ ] Browser shows the streamed message appearing letter by letter (or in
      small chunks).
- [ ] Console still logs `RUN_STARTED` and `RUN_FINISHED` for sanity.
- [ ] No errors in DevTools.
- [ ] First acceptance-criterion item from `TR-NNN` is now demonstrable:
      *"Demo runs end-to-end with make dev"*. Tick it.

## Output

- Updated `agent.service.ts` and `app.component.ts` (or new `chat.component.ts`).
- Commit: `feat(web): render streamed assistant message via signal`.
- Optional: a 10-second screen capture for your own records (do not push the
  video — that is day 20).

## Handoff to day 06

Phase 1 is closed. From day 06 you start adding the rest of the AG-UI events.
Leave the agent emitting only the hello sequence: tomorrow you will extend the
client reducer first, then upgrade the server on subsequent days.

## References

- Angular signals: <https://angular.dev/guide/signals>
- AG-UI text events: <https://docs.ag-ui.com/concepts/events#text>
- Repo's reducer reference (already drafted in initial commit):
  `apps/web/src/app/chat/agent.service.ts`
