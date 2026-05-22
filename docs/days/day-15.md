# Day 15 — Error states, loading skeleton and styling polish

> Phase 2 · Core events and Vensure use case · **Phase 2 closing day**

## Context

Phase 2 closes today. The demo works end-to-end but rough edges remain:
aborted runs leave pending bubbles, network errors are silent, and the visual
hierarchy is plain. Today you polish those edges so the demo is
presentation-ready before phase 3 starts.

## Objective

After today:

- Aborting a run drops the in-flight assistant message instead of leaving it
  spinning.
- A network error (server down, CORS) renders a red banner with the message.
- A subtle loading skeleton appears in the chat area between *Send* and the
  first `TEXT_MESSAGE_CONTENT`.
- Spacing, colours and typography are coherent — no obvious eyesores.

## Time budget

- Calendar: 60 min
- Effective: 30–40 min

## Pre-flight checklist

- [ ] Day 14 composer and abort working.
- [ ] `STATE_DELTA` populates the right pane (day 12–13).
- [ ] You can intentionally kill `uvicorn` to test the error path.

## Actions

1. **In `agent.service.ts`** when `AbortError` fires, also clean up any
   pending assistant message:

   ```typescript
   if ((err as Error).name === 'AbortError') {
     this._messages.update((arr) =>
       arr.filter((m) => !(m.role === 'assistant' && m.pending)),
     );
     this._status.set('idle');
     return;
   }
   ```

2. **Render the error banner** in `chat.component.html` (already prepared in
   day 14):

   ```html
   @if (error()) {
     <div class="error" role="alert">{{ error() }}</div>
   }
   ```

3. **Add a skeleton bubble** while `status() === 'running'` but no assistant
   message exists yet:

   ```html
   @if (isRunning() && !hasAssistantMessage()) {
     <article class="message assistant skeleton">
       <header><span class="role">assistant</span></header>
       <p class="skeleton-text"></p>
     </article>
   }
   ```

   With `hasAssistantMessage = computed(() => messages().some(m => m.role === 'assistant'))`.

4. **Polish styles**:
   - Define CSS variables (`--bg`, `--panel`, `--text`, `--accent`, `--tool`,
     `--border`) in `styles.css` for consistent dark mode.
   - Round corners (`border-radius: 10px`) on bubbles, pills and panel cards.
   - Use `font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", ...` to
     avoid generic default fonts.

5. **Error path test**: stop `uvicorn`, send a message. Expected: red banner
   *"Failed to fetch"* or *"Agent returned HTTP 500"*; *Send* re-enables.

6. **Abort test**: long prompt + click Stop early. Expected: the assistant
   bubble disappears, the chat returns to `idle`, the tool pill stays
   wherever it was (acceptable for a demo).

## Verification

- [ ] Error banner shows up when the API is down.
- [ ] Abort cleans up the in-flight assistant bubble.
- [ ] Skeleton appears briefly between Send and first content chunk.
- [ ] All buttons reachable by keyboard (Tab order is sensible).
- [ ] No console warnings or errors in DevTools.

## Output

- Updated: `agent.service.ts`, `chat.component.ts`, `chat.component.html`,
  `chat.component.css`, `styles.css`.
- Commit: `feat(web): polish error states, skeleton and styling`.

## Handoff to day 16

Phase 2 is closed. From day 16 onwards no new behaviour ships — you only write
documentation, take screenshots and prepare the demo. Push everything to
`origin/main` tonight so the demo is fully reproducible.

## References

- ARIA roles: <https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/alert_role>
- Modern CSS variables:
  <https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties>
