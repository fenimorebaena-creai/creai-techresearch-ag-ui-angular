# Day 07 — TEXT_MESSAGE_END lifecycle and pending state

> Phase 2 · Core events and Vensure use case

## Context

Day 06 added typed events and chat bubbles. The assistant message visibly
streams, but there is no indicator that it is still being produced. Today you
add a `pending` flag toggled by `TEXT_MESSAGE_START` / `TEXT_MESSAGE_END` and a
small blinking dot while pending is `true`.

## Objective

The assistant bubble shows a pulsing dot while streaming; the dot disappears
when the message is closed. Implicitly verifies that `TEXT_MESSAGE_END` is
fired by the server in the right place.

## Time budget

- Calendar: 60 min
- Effective: 30 min

## Pre-flight checklist

- [ ] Day-06 chat-bubble UI working.
- [ ] You can still see two consecutive sends (user + assistant).

## Actions

1. **In `ag-ui.types.ts`**, ensure `ChatMessage.pending?: boolean`.

2. **In `agent.service.ts`**:
   - `TEXT_MESSAGE_START` → set `pending: true` on the new message.
   - `TEXT_MESSAGE_END` → set `pending: false` on the matching message.

3. **In `chat.component.html`**, render a small `<span class="pending-dot"
   aria-label="streaming"></span>` next to the role label when
   `message.pending` is true.

4. **Style** the dot in `chat.component.css`:

   ```css
   .pending-dot {
     width: 8px;
     height: 8px;
     border-radius: 50%;
     background: var(--accent);
     animation: blink 1s infinite;
   }
   @keyframes blink {
     0%, 100% { opacity: 0.3; }
     50%      { opacity: 1; }
   }
   ```

5. **Add an accessibility check**: the pending dot must have an `aria-label`
   so screen readers announce the streaming state.

## Verification

- [ ] During streaming, a dot pulses next to the role label.
- [ ] Once `RUN_FINISHED` arrives, no dot is visible on any message.
- [ ] DOM inspector confirms `pending` toggles in the signal data.
- [ ] No layout shift when the dot appears or disappears.

## Output

- Updated: `agent.service.ts`, `chat.component.html`, `chat.component.css`,
  `ag-ui.types.ts`.
- Commit: `feat(web): show streaming pending dot via TEXT_MESSAGE_END`.

## Handoff to day 08

Phase 2 begins working on tool calls tomorrow. Make sure
`TEXT_MESSAGE_CONTENT` and `TEXT_MESSAGE_END` are reliable — bugs here will
look like bugs in the tool pill on days 08–09.

## References

- ARIA live regions for streaming output:
  <https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-live>
- Day-02 notes (text event family).
