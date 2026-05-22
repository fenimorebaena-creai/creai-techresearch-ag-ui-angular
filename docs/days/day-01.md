# Day 01 — Create Jira ticket and GitHub repo

> Phase 1 · Setup and Hello AG-UI

## Context

This is day one. The research plan exists in `docs/research-plan.md` but no
ticket, no repo and no scaffold are in place yet. Today is administrative: open
the work item on the Technical Research board and create the GitHub repository.

The TR board's convention (see TR-285, TR-290, TR-298) is:

- One *Historia* per research topic, in English, priority `Medium`.
- A `<handle>-creai` user account hosts the demo repo (e.g. `albertocaballero-creai/Guide-Tour`).

## Objective

End the day with **TR-XXX created** on board TR and **the GitHub repository
created** with an empty README, MIT license and `.gitignore`. Nothing runtime
yet.

## Time budget

- Calendar: 60 min (admin-heavy)
- Effective: 30–40 min

## Pre-flight checklist

- [ ] Atlassian access to `creai.atlassian.net` is working.
- [ ] GitHub user `fenimorebaena` (or chosen handle) signed in.
- [ ] SSH key registered on GitHub (`ssh -T git@github.com` returns success).

## Actions

1. **Open the board** at <https://creai.atlassian.net/jira/software/c/projects/TR/boards/8>.
2. **Create a new issue** with:
   - Type: `Historia`
   - Priority: `Medium`
   - Assignee: yourself (`fenimorebaena@creai.mx`)
   - Title (copy verbatim from `docs/research-plan.md`):

     > `AG-UI Protocol + Angular 20: streaming agent client for the Labor Relations Chat`

   - Description: copy the markdown block from the "Primer entregable" section
     of `docs/research-plan.md`. Leave the *Repository* line as
     `<github-url-once-created>` for now — you will edit it later today.
3. **Record the ticket key** (TR-NNN) somewhere you can reach later.
4. **Create the GitHub repository** at
   <https://github.com/new>:
   - Owner: `fenimorebaena-creai` (or chosen handle)
   - Name: `creai-techresearch-ag-ui-angular`
   - Visibility: `Public`
   - Initialise with: `README` checked, `.gitignore` template `Node`,
     `License` `MIT`.
5. **Clone locally** outside the `vensure` workspace:

   ```bash
   cd ~/work
   git clone git@github.com:<handle>-creai/creai-techresearch-ag-ui-angular.git
   cd creai-techresearch-ag-ui-angular
   ```
6. **Replace the GitHub-generated README** with a one-paragraph placeholder that
   states the repo's purpose and links back to the Jira ticket.
7. **Commit and push**:

   ```bash
   git add README.md
   git commit -m "docs: initial README pointing to TR-NNN"
   git push origin main
   ```
8. **Edit the Jira ticket description**: replace `<github-url-once-created>`
   with the real repo URL.

## Verification

- [ ] Ticket `TR-NNN` is visible on the TR board, in `Backlog`.
- [ ] Repo URL <https://github.com/...> serves the placeholder README.
- [ ] `git log --oneline` locally shows the first commit.
- [ ] `git remote -v` shows `origin` pointing to the right repo.

## Output

- Jira: ticket `TR-NNN` (record the number).
- GitHub: repo with README, MIT LICENSE, `.gitignore`.
- Local clone in `~/work/creai-techresearch-ag-ui-angular/`.

## Handoff to day 02

Open in your editor the file `docs/research-plan.md` so tomorrow's first
question — *which AG-UI events do we care about?* — has the table from the
plan right there. Leave the Jira tab open in your browser.

## References

- TR board: <https://creai.atlassian.net/jira/software/c/projects/TR/boards/8>
- Workspace branching strategy (skip the workspace conventions for this
  out-of-tree repo): `~/work/vensure/.cursor/rules/git-branching-strategy.mdc`
- Example research repo for naming convention: <https://github.com/albertocaballero-creai/Guide-Tour>
