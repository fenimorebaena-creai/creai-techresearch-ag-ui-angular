# Day 21 — Buffer and last polish before the demo

> Phase 3 · Findings, comparison and presentation

## Context

Day 21 is the **buffer day**. The research plan intentionally accounted for
slippage. If the previous 20 days went smoothly, today is for last polish.
If there is debt — a broken demo on a fresh clone, a missing screenshot,
a TODO marker still in the code — today is when you pay it.

## Objective

`make install && make dev` works **on a fresh clone** with no `node_modules`
or `.venv` present. Anything you would be embarrassed to show on day 22 is
fixed.

## Time budget

- Calendar: 60 min
- Effective: 30 min (more if there is debt)

## Pre-flight checklist

- [ ] You have ~30 spare minutes in the calendar (this is the buffer).
- [ ] Disk has ~500 MB free for a clean reinstall test.

## Actions

1. **Clean-slate test**. From a sibling directory:

   ```bash
   cd /tmp
   git clone git@github.com:<handle>-creai/creai-techresearch-ag-ui-angular.git fresh
   cd fresh
   make install
   make dev-api &  # one terminal
   make dev-web    # another terminal
   ```

   Open <http://localhost:4200> and run one prompt end-to-end. If anything
   fails — wrong Node version error, missing dependency, port conflict — fix
   the README or `Makefile`, commit, push, and re-clone.

2. **Scan for TODOs and FIXMEs**:

   ```bash
   rg -i 'todo|fixme|xxx' apps docs README.md
   ```

   Decide: fix, defer to a follow-up ticket, or remove. Do not ship a TODO
   in plain sight on demo day.

3. **Spell check** the README and `docs/vensure-integration.md` (use your
   editor's spell checker or `aspell`).

4. **Ticket criteria sweep**. Open `TR-NNN` and verify each acceptance
   checkbox is ticked or has a justification:

   - [ ] Demo runs end-to-end with `make dev`.
   - [ ] At least 1 tool call visible with intermediate + final state.
   - [ ] README with architecture diagram and event coverage.
   - [ ] Decision log: adopt / investigate further / park.
   - [ ] Short screencast (2–3 min).

5. **Prepare the announcement message** for tomorrow's demo (paste into a
   draft email or Slack message — do *not* send today):

   ```
   Hi team,

   Quick 15-minute demo today on TR-NNN: AG-UI Protocol + Angular 20
   streaming agent client.

   Repo:        https://github.com/<handle>-creai/creai-techresearch-ag-ui-angular
   Screencast:  <link>
   Decision:    investigate further with a one-sprint integration spike

   Calendar:    <slot>
   ```

6. **Optional**: skim Angular 20.x changelog for breaking changes since you
   pinned. If anything is relevant, note it in `docs/research-plan.md`'s
   *Status* section.

## Verification

- [ ] Clean-slate clone works.
- [ ] No TODO/FIXME left in `apps/` or `docs/`.
- [ ] Ticket TR-NNN acceptance criteria all ticked (or justified).
- [ ] Announcement message ready (but not sent).

## Output

- Possibly: small fixes committed.
- A draft announcement message saved locally.

## Handoff to day 22

Tomorrow you give the demo and close out the ticket. No code changes
planned. Sleep well.

## References

- Workspace branching strategy (irrelevant for this repo, but consistency):
  `~/work/vensure/.cursor/rules/git-branching-strategy.mdc`
- GitHub release notes:
  <https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases>
