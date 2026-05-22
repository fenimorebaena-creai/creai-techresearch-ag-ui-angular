# Day 20 — Record screencast (2–3 minutes)

> Phase 3 · Findings, comparison and presentation

## Context

All written deliverables are in place by day 19. Today you record a short
demo screencast that the team can watch instead of reading the README. The
goal is **2:30 minutes maximum** — anything longer loses retention.

## Objective

Produce a polished MP4 (or WEBM) screencast that walks a viewer through:

1. The empty state in the browser (10 s).
2. Send "What is the overtime rate?" — show the streamed answer (30 s).
3. Highlight the tool pill transitioning running → completed (30 s).
4. Highlight the context panel populating before the final answer finishes (20 s).
5. Send a holiday question — show the different branching result (30 s).
6. Show the README and `docs/vensure-integration.md` recommendation (20 s).

## Time budget

- Calendar: 60 min
- Effective: 30–40 min (multiple takes likely)

## Pre-flight checklist

- [ ] Demo runs locally without errors.
- [ ] Audio mic tested if you plan voice-over (optional).
- [ ] Browser at a 1280×800 size, devtools closed, chat reset.
- [ ] Recording tool installed (OBS, ShareX, macOS QuickTime, or Loom).
- [ ] Two terminals running `make dev-api` and `make dev-web`.

## Actions

1. **Rehearse once** without recording, with a script in front of you. If
   voice-over: read the script aloud once.

2. **Recording settings** (target small file):
   - 1080p or 720p, 30 fps.
   - Encode H.264 at ~3 Mbps.
   - Mono audio at 64 kbps if voice-over, else mute.

3. **Take 1**: full run-through. If you flub a transition, do *not* stop —
   keep going.

4. **Take 2**: only if take 1 had a hard failure (server crash, blank
   browser). Otherwise edit take 1.

5. **Edit lightly**:
   - Trim the dead time before the empty state.
   - Trim any think-pauses longer than 1 second.
   - No music, no transitions — keep it utilitarian.

6. **Export** as `docs/assets/demo.mp4`. Aim for ≤ 15 MB. If you exceed,
   re-encode at lower bitrate (`ffmpeg -i in.mp4 -vcodec libx264 -crf 28
   out.mp4`).

7. **Do not push the video to git** if it is over 25 MB — GitHub will warn
   you. Instead, upload it as a release asset or in the Jira ticket as an
   attachment. Add a `docs/assets/demo.md` placeholder with a link.

8. **Update the Jira ticket** TR-NNN: add the screencast attachment or link.
   Tick the *Short screencast (2–3 min)* acceptance criterion.

## Verification

- [ ] Video length is between 2:00 and 3:00 minutes.
- [ ] All six story beats above appear in order.
- [ ] No private info on screen (other tabs, Slack notifications, file
      paths with `secrets/...` etc.).
- [ ] Audio (if any) is intelligible at default volume.

## Output

- `docs/assets/demo.mp4` (or external link in `docs/assets/demo.md`).
- Jira ticket TR-NNN updated with the link/attachment.
- Commit: `docs: add demo screencast (link)`.

## Handoff to day 21

Tomorrow is buffer / polish. Have the screencast in a Loom-style shareable
link if you opted out of committing the binary — that link is what you will
paste in the team announcement on day 22.

## References

- ffmpeg quick reference: <https://ffmpeg.org/ffmpeg.html>
- GitHub LFS (if you must commit the video):
  <https://git-lfs.github.com/>
