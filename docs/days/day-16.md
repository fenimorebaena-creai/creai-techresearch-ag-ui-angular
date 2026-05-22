# Day 16 — README architecture section and mermaid diagrams

> Phase 3 · Findings, comparison and presentation

## Context

Phase 2 closed yesterday: a working AG-UI demo is committed and pushed.
Today opens the documentation phase. The first goal is a README that a
teammate can read in 5 minutes and understand: what the demo is, how to run
it, and what is being decided.

## Objective

End the day with a polished `README.md` at the repo root containing:

- A *why this matters* paragraph linking to the Vensure Chat mock.
- A *Quick start* section (clone, install, dev-api, dev-web).
- An *Event coverage* tree of the AG-UI events the demo handles.
- A *high-level architecture* mermaid sequence diagram (chat ↔ FastAPI).
- A *Layout* tree of the repo's directories.
- A link to `docs/vensure-integration.md` for the decision log.

## Time budget

- Calendar: 60 min
- Effective: 30–40 min

## Pre-flight checklist

- [ ] Repo state is clean (`git status` empty).
- [ ] You can render mermaid locally (VS Code preview, Cursor, GitHub).

## Actions

1. **Open `README.md`** (currently a placeholder). Replace it section by
   section. Use the version already drafted in the initial commit as a
   reference if needed — it ships a full template.

2. **Sequence diagram**. Paste this mermaid block (test it renders!):

   ```mermaid
   sequenceDiagram
       autonumber
       participant U as User
       participant W as Angular 20 client
       participant A as FastAPI agent
       U->>W: type prompt and click Send
       W->>A: POST /agent (RunAgentInput, Accept text event-stream)
       A-->>W: SSE RUN_STARTED
       A-->>W: SSE STATE_DELTA (lastUserMessage)
       A-->>W: SSE TEXT_MESSAGE_START + CONTENT + END
       A-->>W: SSE TOOL_CALL_START + ARGS + END + RESULT
       A-->>W: SSE STATE_DELTA (citedClauses)
       A-->>W: SSE TEXT_MESSAGE_START + CONTENT + END
       A-->>W: SSE RUN_FINISHED
   ```

3. **Avoid mermaid pitfalls** (lessons learned from the planning session):
   - No `+` in node names / task names.
   - No parentheses in titles unless quoted.
   - Section names without spaces.
   - Underscores in task names can cause issues in gantt charts; safe in
     sequence diagrams.

4. **Event coverage tree**. A simple ASCII tree is easier to scan than a
   table — paste it inside a `text` fenced block.

5. **Quick start**. Three blocks: clone, `make install`, then two terminals
   running `make dev-api` and `make dev-web`. Mention prerequisites: Python
   3.12+, Node 20.19+.

6. **Commit**: `docs: write README with architecture and quick start`.

## Verification

- [ ] `cat README.md | wc -l` is between roughly 120 and 250 lines.
- [ ] Mermaid block renders on GitHub (`git push` and check the rendered
      version, or use the GitHub preview locally).
- [ ] All internal links (`docs/architecture.md`, `docs/vensure-integration.md`)
      resolve.
- [ ] No typos in the *Quick start* commands.

## Output

- Updated: `README.md`.
- Commit: `docs: write README with architecture and quick start`.

## Handoff to day 17

Tomorrow you take screenshots. Plan to capture: the empty state, mid-stream
state with the tool pill running, and the completed state with the context
pane populated. Run a small `make demo` style script if you want a clean
state each time.

## References

- GitHub mermaid support:
  <https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams>
- Reference draft: `README.md` already in initial commit.
