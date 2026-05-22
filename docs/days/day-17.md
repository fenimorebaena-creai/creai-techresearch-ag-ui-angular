# Day 17 — Screenshots and annotated UI captures

> Phase 3 · Findings, comparison and presentation

## Context

Day 16 produced the README architecture section. A picture beats prose for
the *Vensure integration analysis* and the live demo: today you capture three
to four screenshots that tell the story of one chat round, annotate them, and
embed them in the README.

## Objective

The README has an *Screenshots* section showing:

1. Empty state with the composer focused.
2. Mid-stream: assistant bubble in `pending`, tool pill in `running`.
3. Completed state: final assistant message, tool pill `completed`, context
   panel populated with two clause cards.
4. *(Optional)* The error banner state.

## Time budget

- Calendar: 60 min
- Effective: 30 min

## Pre-flight checklist

- [ ] `apps/api` and `apps/web` running, day-15 polished UI live.
- [ ] You have a screenshot tool. On WSL2 use the Windows Snipping Tool
      (Win + Shift + S) and paste into a file viewer, or use a browser
      extension that crops by element.

## Actions

1. **Create `docs/assets/`** (or `screenshots/` — pick one and stick with it).

2. **Capture sequence**:
   - Reset the chat → screenshot `01-empty.png`.
   - Send "What is the overtime rate?" → quickly capture mid-stream (the
     pulsing dot is the cue) → `02-streaming.png`.
   - Wait for completion → `03-completed.png`.
   - Kill `uvicorn`, send again → `04-error.png` (optional).

3. **Annotate** with a free tool (Snagit, Greenshot, Apple Preview). Add
   small arrows pointing to:
   - The pulsing dot (image 02).
   - The yellow tool pill (image 02).
   - The cited clauses panel (image 03).

4. **Optimise** before committing: PNGs above ~150 KB add up. Run
   `pngquant 02-streaming.png --output 02-streaming.min.png` or upload to
   <https://tinypng.com>. Keep each image below 200 KB.

5. **Embed** in `README.md`:

   ```markdown
   ## Screenshots

   ![Empty composer](docs/assets/01-empty.png)
   ![Mid-stream](docs/assets/02-streaming.png)
   ![Completed run](docs/assets/03-completed.png)
   ```

6. **Commit**: `docs: add annotated UI screenshots`.

## Verification

- [ ] Each screenshot renders on GitHub after push.
- [ ] Total weight added to the repo is under ~600 KB.
- [ ] Annotations are legible at 100 % zoom.

## Output

- 3–4 PNG files under `docs/assets/`.
- Updated: `README.md` with Screenshots section.
- Commit: `docs: add annotated UI screenshots`.

## Handoff to day 18

Tomorrow you start the comparative integration analysis. Have the screenshots
side by side with `~/work/vensure/docs/backend/08-open-questions.md` open to
recall the WebSocket auth and catch-up gaps.

## References

- pngquant: <https://pngquant.org/>
- WCAG image alt-text guidance:
  <https://www.w3.org/WAI/tutorials/images/decision-tree/>
