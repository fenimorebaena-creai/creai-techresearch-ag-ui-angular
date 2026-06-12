# TR-306 — Live demo runbook

Script and fallbacks for the **2026-06-22** demo of the AG-UI + Angular 20
research spike. Target length: **5–7 min live**, with a **2–3 min screencast**
as backup (`scripts/record-demo.mjs`, see [§5](#5-screencast-backup)).

The whole point to land: the real Labor Relations chat today is a **blocking
REST + gRPC request/response** (VN-54); AG-UI turns that into a **streaming,
tool-aware, cancellable** experience over plain HTTP + SSE. We are demoing the
*experience upgrade*, on a deterministic mock, not a production integration.

---

## 1. Pre-flight checklist (do this before the call)

Run ~10 min before, on the machine that will present:

- [ ] On `main`, clean tree, latest pulled (`git pull`).
- [ ] `make install` already run once (`apps/api/.venv` + `apps/web/node_modules` exist).
- [ ] **Port 8001 is free.** The mock agent runs on **:8001** on purpose, to avoid
      colliding with `creai_labor-relations` on :8000. Check: `lsof -i :8001`.
      If busy, either kill it or run the API with `PORT=8002 make dev-api` and
      update `AGENT_URL` in `apps/web/src/app/chat/agent.service.ts` to match.
- [ ] **Port 4200 is free** (`lsof -i :4200`).
- [ ] Boot both: `make dev` (or two terminals: `make dev-api`, `make dev-web`).
- [ ] Open <http://localhost:4200> and run **one warm-up query** ("What is the
      overtime rate?"), confirm: streamed answer, `search_cba_clause` pill goes
      running → completed, context panel fills. Then click **Reset**.
- [ ] Open DevTools → Network, filter to the `/agent` request, **EventStream**
      tab visible (this is the money shot — see [§3](#3-the-wire-money-shot)).
- [ ] Browser zoom ~125–150% so text is legible on the projector.
- [ ] Screencast backup file is on the desktop and plays (`docs/screenshots/`
      area or wherever you exported it) — in case live fails.
- [ ] **Leave `USE_LLM` unset.** The deterministic pool is the safe live default.
      (Only enable the Ollama path if you have explicitly rehearsed it — see
      [§6](#6-optional-the-live-llm-path).)

---

## 2. Demo script (live)

All queries below hit the deterministic intent router in
`apps/api/src/responses.py`, so they always work offline. Click **Reset**
between sections to keep the panel clean.

### Beat 1 — The streaming answer (≈90s)

Type: **"What is the overtime rate?"**

- The user bubble appears instantly.
- The assistant message **streams token by token** (an intro line, then the
  answer). Say: *"Notice the answer arrives incrementally — this is
  `TEXT_MESSAGE_CONTENT` deltas over SSE. Today's chat blocks on a single REST
  call and shows a spinner until the whole answer is ready."*
- A `search_cba_clause` **tool pill** appears, **running → completed**. Say:
  *"The retrieval step is visible as a first-class tool call — `TOOL_CALL_*`
  events. In the current chat the equivalent gRPC steps are invisible until the
  response is fully assembled."*
- The right **context panel** populates with the cited clause(s) via
  `STATE_DELTA`. Say: *"Shared state is patched incrementally — JSON-Patch over
  `STATE_DELTA` — so an evidence panel can fill in as the agent works."*

### Beat 2 — Different intents, varied responses (≈60s)

Click **Reset**, then run two more to show it is not a single canned reply:

- **"How does seniority affect layoffs?"** → Article V clause.
- **"How do I file a grievance?"** → Article XX clause.

Say: *"Each question is routed to its own clause set, and the phrasing varies
run-to-run, so a live audience does not see the same string twice. This is a
mock — the real version would stream from the graph + LLM pipeline behind the
same events."*

### Beat 3 — Cancellation (≈30s)

Type any query and **click Stop mid-stream**. The run aborts, the input frees up.
Say: *"Because it's a stream, the client can abort it — `abortRun()` on the
client, the server stops emitting. A blocking REST call can't be cancelled like
this from the UI."*

### Beat 4 — The wire (≈60s)

Switch to DevTools → Network → the `/agent` request → **EventStream**. See [§3].

---

## 3. The wire (money shot)

In DevTools → Network → `/agent` → **EventStream**, the audience sees the raw
AG-UI event sequence:

```
RUN_STARTED
STATE_DELTA            (lastUserMessage)
TEXT_MESSAGE_START / …_CONTENT × N / …_END
TOOL_CALL_START / …_ARGS × N / …_END / …_RESULT
STATE_DELTA            (citedClauses)
TEXT_MESSAGE_START / …_CONTENT × N / …_END
RUN_FINISHED
```

Say: *"This is the entire contract — ~16 standardised event types, off-the-shelf
TS types from `@ag-ui/client`. No bespoke per-feature JSON taxonomy to invent,
and it's inspectable with `curl -N`."*

---

## 4. Closing — the recommendation (≈45s)

*"Recommendation: a small, time-boxed integration spike — one sprint, one FE +
one BE. The client pattern is settled: `@ag-ui/client`'s `HttpAgent` plus a thin
Angular signals layer (there is no first-party Angular client — CopilotKit is
React-only). The one hard blocker to clear first is SSE behind our PrismHR /
PrismOne ingress — `proxy_buffering` on Azure App Gateway / nginx can break
streaming. If SSE survives staging, AG-UI upgrades the existing blocking chat
into a streaming, agentic one for free; if not, the synchronous REST chat stays
and we revisit."*

Point to [`docs/vensure-integration.md`](vensure-integration.md) for the full
analysis and [`README.md`](../README.md) for the decision log.

---

## 5. Screencast backup

Two layers of backup:

**a) Auto-recorded silent clip (guaranteed fallback).** A short (~40s) silent
screencast that drives the same beats headlessly and records video. Generate it
on the demo machine ahead of time:

```bash
make dev            # api on :8001 + web on :4200, in another terminal
make record-demo    # → docs/media/<page-id>.webm  (regenerated on demand, gitignored)
```

The output is **`.webm`** (plays in any browser / VLC — fine as-is). To convert
to `.mp4`, use a **full ffmpeg** (Playwright's bundled ffmpeg has no mp4 muxer):

```bash
ffmpeg -y -i docs/media/<page-id>.webm -movflags +faststart -pix_fmt yuv420p \
  -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" docs/media/demo-screencast.mp4
```

Open the file in a browser tab before the call so you can cut to it in seconds.

**b) Narrated version (preferred for stakeholders).** Screen-record the live run
yourself (OBS / Loom / macOS ⇧⌘5) following [§2](#2-demo-script-live) — the beats
above double as the storyboard, and the talk-track lines are the narration.

---

## 6. Optional: the live LLM path

Off by default. Only use it if rehearsed. It streams the **final answer** from a
local Ollama model; `RUN_*`, `TOOL_CALL_*` and `STATE_DELTA` stay deterministic,
and it **falls back to the pool** if Ollama is unreachable, so it never hard-fails.

```bash
ollama pull llama3.2:1b          # once, ahead of time
USE_LLM=1 make dev-api
```

**Gotchas (from rehearsal):**

- The corporate **VPN blocks the WSL gateway DNS** (`10.255.255.254:53`), so
  `ollama pull` fails while the VPN is connected — **disconnect VPN to pull**.
- `ollama serve` caches `/etc/resolv.conf` at startup — **restart it** after any
  DNS change.
- For the live demo, the **pool is the safe default**; treat the LLM path as a
  "nice to show if asked", not the main line.

---

## 7. Fallback quick-reference

| Symptom                              | Fix                                                                                 |
| ------------------------------------ | ----------------------------------------------------------------------------------- |
| Live demo broken at showtime         | Cut to the **screencast backup** ([§5]). Narrate over it.                            |
| Port 8001 busy                       | `PORT=8002 make dev-api` + update `AGENT_URL` in `agent.service.ts`.                 |
| Port 4200 busy                       | `ng serve --port 4300` and open that.                                               |
| Web shows nothing / fetch error      | Confirm API up: `curl -s localhost:8001/health` → `{"status":"ok"}`. Hard-refresh.  |
| Answer looks "stuck"                 | It's a stream; wait. If truly stuck, **Reset** and re-ask.                          |
| LLM path weird/slow                  | `unset USE_LLM` and restart the API — back to the deterministic pool.               |
| Same answer twice on stage           | Expected variety is per-run random; click **Reset** and pick a **different intent** (overtime / seniority / grievance / vacation). |
| "Illegal invocation" in console      | Known zoneless `fetch` binding — already handled in `agent.service.ts`; hard-refresh if it appears after an edit. |
