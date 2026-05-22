# Day 06 — TEXT_MESSAGE_START and CONTENT streaming

> Phase 2 · Core events and Vensure use case

## Context

Phase 1 closed yesterday: the Angular client can already render an incremental
message. The `agent.service.ts` reducer is the minimal version — today you
solidify it into a proper, typed reducer that other day files (07, 08, 12)
can extend without surprises.

## Objective

Replace the day-05 ad-hoc reducer with a typed event handler and a
`ChatComponent` rendering messages with proper roles. After today, the
**chat-bubble** look is in place but tool pills and the context panel are
still missing.

## Time budget

- Calendar: 60 min
- Effective: 30 min

## Pre-flight checklist

- [ ] `apps/api` running on `:8000`.
- [ ] `apps/web` running on `:4200`.
- [ ] Day-05 hello stream still works.

## Actions

1. **Create `apps/web/src/app/chat/ag-ui.types.ts`** with the discriminated
   union covering the events you have already used:
   `RUN_STARTED`, `RUN_FINISHED`, `TEXT_MESSAGE_START`, `TEXT_MESSAGE_CONTENT`,
   `TEXT_MESSAGE_END`. Add stubs for tool/state events; you will fill them on
   days 08 and 12.

2. **Define a `ChatMessage` interface**:

   ```typescript
   export interface ChatMessage {
     id: string;
     role: 'user' | 'assistant' | 'tool' | 'system';
     content: string;
     pending?: boolean;
   }
   ```

3. **Refactor `agent.service.ts`** so `handleEvent` does a `switch (event.type)`
   over the typed union. The case for `TEXT_MESSAGE_CONTENT` should use
   `this._messages.update((arr) => arr.map(...))` to keep immutability.

4. **Add a `sendMessage(text: string)` flow** that:

   - Appends a `user` message to the signal before fetching.
   - Forwards the entire `messages()` array as `RunAgentInput.messages` (the
     mock agent ignores them today, but this prepares for day 10).

5. **Extract `ChatComponent`** at `src/app/chat/chat.component.ts`. Move the
   message list and the send button there. Bind `messages()` with `@for`.

6. **In `AppComponent`** keep only the header and `<app-chat />`.

7. **Restart `npm start`** and click the button several times. Each click
   should add a user bubble then a streamed assistant bubble.

## Verification

- [ ] User messages are visually distinct from assistant messages (e.g. different
      background colour).
- [ ] No regression in streaming: bubbles still grow chunk by chunk.
- [ ] TypeScript: zero `any` types in `ag-ui.types.ts`.
- [ ] No console errors when clicking the button twice in a row.

## Output

- New: `ag-ui.types.ts`, `chat.component.ts`, `chat.component.html`,
  `chat.component.css`.
- Updated: `app.component.ts`, `agent.service.ts`.
- Commit: `feat(web): typed AG-UI event union and chat-bubble UI`.

## Handoff to day 07

Tomorrow handles `TEXT_MESSAGE_END` plus the `pending` flag (animation while
streaming, removed when the assistant message is closed). Leave a `// TODO:
day-07` comment in the `TEXT_MESSAGE_END` case so you don't lose track.

## References

- Day-02 notes on the text event family: `docs/notes-ag-ui.md`.
- Angular control flow: <https://angular.dev/guide/templates/control-flow>
- Reference implementation in initial commit: `apps/web/src/app/chat/`.
