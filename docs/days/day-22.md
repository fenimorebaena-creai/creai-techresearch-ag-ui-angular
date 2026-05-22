# Day 22 — Team demo and Jira ticket transition

> Phase 3 · Findings, comparison and presentation · **Sprint closing day**

## Context

The last day of the 22-day execution window. The research is done; today is
about communicating the findings and closing the loop on Jira.

## Objective

End the day with:

- A 15-minute team demo delivered.
- `TR-NNN` transitioned to `Finalizada` with a short summary comment.
- A follow-up Jira ticket created (if the team votes *adopt* or *spike*)
  to track the next step in `creai_labor-relations` / `-front`.

## Time budget

- Calendar: 60 min (15 min demo + 30 min Q&A + 15 min admin)
- Effective: 30 min admin after the meeting

## Pre-flight checklist

- [ ] Team demo slot scheduled (request it during day 21's polish).
- [ ] Screencast link in your clipboard.
- [ ] Repo at HEAD, no uncommitted changes.
- [ ] Browser at <http://localhost:4200> with the chat in `idle`, devtools
      closed.

## Actions

### Before the meeting (15 min)

1. **Open three tabs** in the browser:
   - <http://localhost:4200> (the running demo)
   - `README.md` rendered on GitHub
   - The Jira ticket `TR-NNN`
2. **Open one terminal** with `make dev-api` running (so you can show
   `curl -N POST /agent` if asked).
3. **Mute notifications** (Slack, Teams, Discord).

### During the meeting (15 min)

1. **30 seconds** — context: *Vensure Chat tab is currently mocked.
   AG-UI is the open protocol that streams agent ↔ frontend events. I
   prototyped an Angular 20 client and a FastAPI emitter.*
2. **3 minutes** — live demo of two prompts (overtime, holiday).
3. **2 minutes** — README architecture diagram walk-through.
4. **3 minutes** — `docs/vensure-integration.md` six dimensions, ending in
   the *Recommendation*.
5. **6 minutes** — Q&A, ending in a vote: adopt / spike / park.

### After the meeting (30 min)

1. **Add a comment** on `TR-NNN`:

   ```markdown
   Demo delivered 2026-MM-DD. Team consensus: <adopt | spike | park>.

   Decision summary:
   - <one bullet recap>
   - <one bullet next step>

   Repo:        https://github.com/<handle>-creai/creai-techresearch-ag-ui-angular
   Screencast:  <link>
   Slides:      <link if any, else "see README">
   ```

2. **Transition the ticket** from `IN PROGRESS.` (or wherever it is) to
   `Finalizada` via the Jira UI or the MCP `transitionJiraIssue` tool.

3. **Create the follow-up ticket** if the team voted *adopt* or *spike*:

   ```
   Title:  Spike — AG-UI integration in creai_labor-relations Chat
   Type:   Tarea (or Historia)
   Repo:   creai_labor-relations + creai_labor-relations-front
   Link:   blocks <new ticket>, refs TR-NNN
   ```

4. **Tag the repo**:

   ```bash
   cd ~/work/creai-techresearch-ag-ui-angular
   git tag -a v1.0.0 -m "AG-UI Angular research demo — TR-NNN closed"
   git push origin v1.0.0
   ```

5. **Optional**: GitHub Release with a one-paragraph summary and the
   screencast link.

## Verification

- [ ] `TR-NNN` is in status `Finalizada`.
- [ ] The follow-up ticket (if any) exists and links back to `TR-NNN`.
- [ ] Repo has a `v1.0.0` tag pushed.
- [ ] No private repo links left in the team announcement.

## Output

- Jira: ticket closed, comment added, optional follow-up created.
- Repo: `v1.0.0` tag, possibly a GitHub Release.
- Team: aware of the recommendation.

## Sprint retro

The plan budgeted 11 h of effective work over 22 days. If you finished in
under 11 h, write a one-paragraph retro at the bottom of `docs/research-plan.md`:
what went faster than expected, what slipped, what to do differently next
research sprint.

## References

- Atlassian MCP transition tool descriptor:
  `~/.cursor/projects/.../tools/transitionJiraIssue.json`
- GitHub Releases:
  <https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository>
- This was the last day. Congratulations.
