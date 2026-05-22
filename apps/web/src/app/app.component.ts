import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ChatComponent } from './chat/chat.component';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChatComponent],
  template: `
    <header class="app-header">
      <h1>AG-UI &middot; Labor Relations Assistant <small>(research demo)</small></h1>
    </header>
    <main>
      <app-chat />
    </main>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100vh;
      }
      .app-header {
        padding: 12px 20px;
        border-bottom: 1px solid var(--border);
        background: var(--panel);
      }
      .app-header h1 {
        font-size: 16px;
        margin: 0;
        font-weight: 600;
      }
      .app-header small {
        font-weight: 400;
        color: var(--text-dim);
        margin-left: 6px;
      }
      main {
        flex: 1;
        overflow: hidden;
      }
    `,
  ],
})
export class AppComponent {}
