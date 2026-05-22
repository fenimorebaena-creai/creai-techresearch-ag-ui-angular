# Day 14 — Composer input, send and abort controls

> Phase 2 · Core events and Vensure use case

## Context

Until today the user typed nothing — clicking *Send hello* posted a fixed
message. Today you replace that with a proper composer (text input, Send and
Abort buttons) and wire request cancellation via `AbortController`.

## Objective

End the day with a Vensure-themed chat:

- A text input bound to a `draft` signal.
- *Send* enabled when `draft` is non-empty and status is not `running`.
- *Stop* button visible only while running, calling `agent.stop()` which
  triggers `AbortController.abort()`.
- *Reset* button clearing messages, tools and state.

## Time budget

- Calendar: 60 min
- Effective: 30–40 min

## Pre-flight checklist

- [ ] Days 12–13 working: state-driven context pane renders.
- [ ] `FormsModule` available (Angular 20 standalone import).

## Actions

1. **In `agent.service.ts`** add fields:

   ```typescript
   private abortController: AbortController | null = null;

   async sendMessage(text: string): Promise<void> {
     // ...build input...
     this.abortController = new AbortController();
     try {
       const response = await fetch(AGENT_URL, {
         ...,
         signal: this.abortController.signal,
       });
       // ...
     } catch (err) {
       if ((err as Error).name === 'AbortError') {
         this._status.set('idle');
         return;
       }
       this._error.set((err as Error).message);
       this._status.set('error');
     }
   }

   stop(): void { this.abortController?.abort(); }

   reset(): void {
     this._messages.set([]);
     this._toolCalls.set({});
     this._agentState.set({});
     this._status.set('idle');
     this._error.set(null);
   }
   ```

2. **In `chat.component.ts`** import `FormsModule` and add:

   ```typescript
   protected readonly draft = signal<string>('What is the overtime rate?');
   protected readonly isRunning = computed(() => this.status() === 'running');

   protected onSend(): void {
     const text = this.draft().trim();
     if (!text || this.isRunning()) return;
     this.draft.set('');
     void this.agent.sendMessage(text);
   }
   ```

3. **In `chat.component.html`** add the composer form:

   ```html
   <form class="composer" (ngSubmit)="onSend()">
     <input
       type="text"
       name="prompt"
       [ngModel]="draft()"
       (ngModelChange)="draft.set($event)"
       placeholder="Ask about a CBA clause..."
       [disabled]="isRunning()"
       autocomplete="off"
     />
     @if (isRunning()) {
       <button type="button" class="stop" (click)="onStop()">Stop</button>
     } @else {
       <button type="submit" class="send" [disabled]="!draft().trim()">Send</button>
     }
     <button type="button" class="reset" (click)="onReset()">Reset</button>
   </form>
   ```

   Note the **one-way binding**: `[ngModel]` + `(ngModelChange)`. Two-way
   `[(ngModel)]` does not work directly with signals.

4. **Smoke test**:
   - Type, Enter → request goes out, *Stop* appears.
   - Click *Stop* mid-stream → request aborts cleanly, no half-rendered
     assistant message stays in `pending`.
   - Click *Reset* → everything clears.

## Verification

- [ ] Enter key triggers send.
- [ ] *Stop* aborts the fetch (Network tab shows the request status
      `cancelled`).
- [ ] *Reset* empties messages, tools and the context pane.
- [ ] Sending a second message with a different prompt produces a different
      tool result (day 11 branching).

## Output

- Updated: `agent.service.ts`, `chat.component.ts`, `chat.component.html`,
  `chat.component.css`.
- Commit: `feat(web): composer input with send, stop and reset`.

## Handoff to day 15

Aborting today leaves the assistant message in `pending: true`. Day 15 will
fix that by either dropping the pending message on abort or marking it as
`role: 'system'` with an *(aborted)* tag.

## References

- Signals with forms: <https://angular.dev/guide/signals/inputs>
- `AbortController`:
  <https://developer.mozilla.org/en-US/docs/Web/API/AbortController>
