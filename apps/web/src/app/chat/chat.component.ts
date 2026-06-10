import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgentService } from './agent.service';
import { ChatMessage, ToolCall } from './ag-ui.types';

interface CitedClause {
  id: string;
  union: string;
  section: string;
  excerpt: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent {
  private readonly agent = inject(AgentService);

  protected readonly messages = this.agent.messages;
  protected readonly status = this.agent.status;
  protected readonly error = this.agent.error;
  protected readonly agentState = this.agent.agentState;

  protected readonly toolCallsList = computed<ToolCall[]>(() =>
    Object.values(this.agent.toolCalls()).sort((a, b) => a.id.localeCompare(b.id)),
  );

  protected readonly citedClauses = computed<CitedClause[]>(() => {
    const cited = this.agentState()['citedClauses'];
    return Array.isArray(cited) ? (cited as CitedClause[]) : [];
  });

  protected readonly isRunning = computed(() => this.status() === 'running');

  protected readonly draft = signal<string>('What is the overtime rate?');

  private readonly messagesEl = viewChild<ElementRef<HTMLElement>>('messagesList');

  constructor() {
    // Keep the latest message/tool-call in view as the stream grows.
    effect(() => {
      this.messages();
      this.toolCallsList();
      const el = this.messagesEl()?.nativeElement;
      if (el) {
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight;
        });
      }
    });
  }

  protected onSend(): void {
    const text = this.draft().trim();
    if (!text || this.isRunning()) return;
    this.draft.set('');
    void this.agent.sendMessage(text);
  }

  protected onStop(): void {
    this.agent.stop();
  }

  protected onReset(): void {
    this.agent.reset();
  }

  protected trackMessage(_index: number, message: ChatMessage): string {
    return message.id;
  }

  protected trackTool(_index: number, tool: ToolCall): string {
    return tool.id;
  }

  protected trackClause(_index: number, clause: CitedClause): string {
    return clause.id;
  }
}
