# Day 04 — Scaffold the Angular 20 standalone client

> Phase 1 · Setup and Hello AG-UI

## Context

Days 01–03 done: ticket open, AG-UI notes written, FastAPI agent streaming a
fixed "Hello" sequence on `POST /agent`. Today you create the Angular
counterpart **as a minimal standalone app with zoneless change detection** —
nothing fancy yet, just enough to send a POST and log the SSE frames in the
browser console.

## Objective

End the day with `apps/web/` containing:

- Angular 20 standalone app bootstrapped with `provideZonelessChangeDetection()`.
- An `AppComponent` rendering a button "Send hello".
- An `AgentService` whose `sendMessage()` POSTs to `http://localhost:8000/agent`
  and `console.log`s every parsed AG-UI event.

No chat UI yet. No signals reducer. That is day 05–07.

## Time budget

- Calendar: 60 min
- Effective: 30–40 min

## Pre-flight checklist

- [ ] `node --version` ≥ 20.19 (or ≥ 22.12). If older, install via nvm.
- [ ] `npm --version` ≥ 10.
- [ ] FastAPI agent from day 03 still works (`make dev-api` or `uvicorn` directly).

## Actions

1. **Bootstrap the Angular app** (one of two ways):

   **Option A — `ng new`** (downloads ~250 MB of deps):

   ```bash
   cd apps
   npx -p @angular/cli@^20 ng new web \
     --standalone --routing=false --style=css --strict --skip-git
   ```

   **Option B — manual scaffold** (use the file shapes already in the initial
   commit as reference): `package.json`, `angular.json`, `tsconfig.json`,
   `tsconfig.app.json`, `src/index.html`, `src/main.ts`, `src/styles.css`.

2. **Configure zoneless change detection** in `apps/web/src/app/app.config.ts`:

   ```typescript
   import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';

   export const appConfig: ApplicationConfig = {
     providers: [provideZonelessChangeDetection()],
   };
   ```

3. **Replace the generated `AppComponent`** with a button + log area:

   ```typescript
   import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
   import { AgentService } from './chat/agent.service';

   @Component({
     selector: 'app-root',
     standalone: true,
     changeDetection: ChangeDetectionStrategy.OnPush,
     template: `<button (click)="send()">Send hello</button>`,
   })
   export class AppComponent {
     private readonly agent = inject(AgentService);
     send() { void this.agent.sendMessage('Hello'); }
   }
   ```

4. **Create `src/app/chat/agent.service.ts`** with just a `fetch()` + manual SSE
   parser. Keep it dumb: `console.log` every parsed event, no signals yet.

5. **Install and run**:

   ```bash
   cd apps/web
   npm install
   npm start
   ```

6. **Open** <http://localhost:4200>, open DevTools console, click the button.
   You should see ~6 `console.log` lines with `RUN_STARTED`,
   `TEXT_MESSAGE_*`, `RUN_FINISHED` payloads.

7. If CORS blocks the request, add `http://localhost:4200` to the CORS allow
   list in the FastAPI server (day 03's `main.py`).

## Verification

- [ ] `npm start` produces no compile errors.
- [ ] Browser at <http://localhost:4200> renders the button.
- [ ] Clicking it shows the AG-UI events in the console in order.
- [ ] Network tab shows the `POST /agent` request with
      `Content-Type: text/event-stream` in the response headers.

## Output

- New files under `apps/web/`.
- Commit: `feat(web): scaffold Angular 20 standalone client with raw SSE log`.

## Handoff to day 05

Leave `apps/web/node_modules/` in place (it is git-ignored). Keep the agent
running on port 8000 if you can. Tomorrow you'll replace the `console.log`
debug with a real `signal<string>()` that shows the streamed text in the DOM.

## References

- Angular 20 release notes: <https://angular.dev/guide/release-notes>
- Zoneless change detection guide: <https://angular.dev/guide/experimental/zoneless>
- AG-UI HttpAgent SDK: <https://docs.ag-ui.com/sdk/js/client/http-agent>
