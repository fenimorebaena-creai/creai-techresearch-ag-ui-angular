# Day 13 — Context panel UI driven by agentState signal

> Phase 2 · Core events and Vensure use case

## Context

Day 12 wired `STATE_DELTA` into an `agentState` signal but nothing renders it.
Today you split the chat layout into two columns and render the
`citedClauses` array as a list of clause cards in a right-hand pane that
updates **as deltas arrive**, before the final assistant message is even
finished.

## Objective

The browser shows a two-column UI: the chat on the left, a "Context state"
panel on the right with a hint *"Updated incrementally via STATE_DELTA
events"* and a card per clause.

## Time budget

- Calendar: 60 min
- Effective: 30–40 min

## Pre-flight checklist

- [ ] Day 12 `STATE_DELTA` working server-side and reducer-side.
- [ ] You can see `citedClauses` in the agent state via DevTools.

## Actions

1. **Add a `computed`** in `chat.component.ts`:

   ```typescript
   protected readonly citedClauses = computed<CitedClause[]>(() => {
     const cited = this.agentState()['citedClauses'];
     return Array.isArray(cited) ? (cited as CitedClause[]) : [];
   });
   ```

2. **Restructure the template** in `chat.component.html`:

   ```html
   <section class="layout">
     <div class="chat-pane">
       <!-- existing messages and tool pills -->
     </div>
     <aside class="context-pane">
       <h2>Context state</h2>
       <p class="hint">Updated incrementally via <code>STATE_DELTA</code> events.</p>
       @if (citedClauses().length === 0) {
         <p class="empty">No cited clauses yet.</p>
       } @else {
         <ul class="clauses">
           @for (clause of citedClauses(); track trackClause($index, clause)) {
             <li>
               <h3>{{ clause.section }}</h3>
               <span class="union">{{ clause.union }}</span>
               <p>{{ clause.excerpt }}</p>
             </li>
           }
         </ul>
       }
     </aside>
   </section>
   ```

3. **Style** the layout with a CSS grid in `chat.component.css`:

   ```css
   .layout {
     display: grid;
     grid-template-columns: 1fr 360px;
     height: 100%;
   }
   .context-pane {
     border-left: 1px solid var(--border);
     padding: 16px;
     overflow-y: auto;
   }
   @media (max-width: 900px) {
     .layout { grid-template-columns: 1fr; }
     .context-pane { display: none; }
   }
   ```

4. **Manual smoke**: send the overtime prompt. You should see:
   - Tool pill fires
   - **Before** the final assistant message finishes, the right pane already
     shows the cited clause.

   That ordering matters: it demonstrates the value of `STATE_DELTA` over a
   batch JSON response.

## Verification

- [ ] Two-column layout renders cleanly above ~900 px.
- [ ] On a narrower viewport, the context pane is hidden (mobile fallback).
- [ ] After a send, the clause card appears **before** the assistant message
      is fully streamed.
- [ ] Sending a second message updates the panel without flicker.

## Output

- Updated: `chat.component.ts`, `chat.component.html`, `chat.component.css`.
- Commit: `feat(web): right-hand context panel bound to agentState signal`.

## Handoff to day 14

Tomorrow handles the user input: a real text field with Enter-to-send, a
disabled state while running, and an Abort button. Leave the layout intact.

## References

- Day 12 STATE_DELTA reducer in `agent.service.ts`.
- Angular `computed`: <https://angular.dev/guide/signals#computed-signals>.
