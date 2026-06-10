import { Injectable, signal } from '@angular/core';
import { HttpAgent, type AgentSubscriber } from '@ag-ui/client';
import { ChatMessage, ToolCall } from './ag-ui.types';

// The mock agent runs on :8001 by default to avoid colliding with other local
// FastAPI backends (e.g. creai_labor-relations on :8000). Keep this in sync with
// the PORT used by `make dev-api` / scripts/dev.sh.
const AGENT_URL = 'http://localhost:8001/agent';

/**
 * AG-UI client backed by the first-party `@ag-ui/client` `HttpAgent`.
 *
 * `HttpAgent` owns the POST + SSE transport, event-sequence verification and the
 * shared-state reduction (RFC 6902 JSON-Patch via `fast-json-patch`). This
 * service is the thin Angular glue: it mirrors the agent's reduced state and the
 * streamed text/tool-call events into signals:
 *   - messages()   : chat messages (user + assistant streamed deltas)
 *   - toolCalls()  : map of ToolCall keyed by toolCallId
 *   - agentState() : shared agent state (kept in sync from the client)
 *   - status()     : 'idle' | 'running' | 'error' | 'finished'
 *   - error()      : last error message
 *
 * There is no first-party Angular client (CopilotKit ships React only and
 * `@ag-ui/angular` does not exist), so this glue is the recommended pattern:
 * official transport + a small custom signals layer.
 */
@Injectable({ providedIn: 'root' })
export class AgentService {
  private readonly _messages = signal<ChatMessage[]>([]);
  private readonly _toolCalls = signal<Record<string, ToolCall>>({});
  private readonly _agentState = signal<Record<string, unknown>>({});
  private readonly _status = signal<'idle' | 'running' | 'error' | 'finished'>('idle');
  private readonly _error = signal<string | null>(null);

  readonly messages = this._messages.asReadonly();
  readonly toolCalls = this._toolCalls.asReadonly();
  readonly agentState = this._agentState.asReadonly();
  readonly status = this._status.asReadonly();
  readonly error = this._error.asReadonly();

  private agent = this.createAgent();

  private createAgent(): HttpAgent {
    return new HttpAgent({ url: AGENT_URL, threadId: `t-${crypto.randomUUID()}` });
  }

  /** Mirror the streamed events into the UI signals. */
  private readonly subscriber: AgentSubscriber = {
    onRunStartedEvent: () => {
      this._status.set('running');
    },
    onRunFinishedEvent: () => {
      this._status.set('finished');
    },
    onRunErrorEvent: ({ event }) => {
      this._error.set(event.message);
      this._status.set('error');
    },
    onTextMessageStartEvent: ({ event }) => {
      this._messages.update((messages) => [
        ...messages,
        { id: event.messageId, role: 'assistant', content: '', pending: true },
      ]);
    },
    onTextMessageContentEvent: ({ event }) => {
      this._messages.update((messages) =>
        messages.map((m) =>
          m.id === event.messageId ? { ...m, content: m.content + event.delta } : m,
        ),
      );
    },
    onTextMessageEndEvent: ({ event }) => {
      this._messages.update((messages) =>
        messages.map((m) => (m.id === event.messageId ? { ...m, pending: false } : m)),
      );
    },
    onToolCallStartEvent: ({ event }) => {
      this._toolCalls.update((tools) => ({
        ...tools,
        [event.toolCallId]: {
          id: event.toolCallId,
          name: event.toolCallName,
          args: '',
          status: 'running',
        },
      }));
    },
    onToolCallArgsEvent: ({ event }) => {
      this._toolCalls.update((tools) => {
        const existing = tools[event.toolCallId];
        if (!existing) return tools;
        return { ...tools, [event.toolCallId]: { ...existing, args: existing.args + event.delta } };
      });
    },
    onToolCallEndEvent: ({ event }) => {
      this._toolCalls.update((tools) => {
        const existing = tools[event.toolCallId];
        if (!existing) return tools;
        return { ...tools, [event.toolCallId]: { ...existing, status: 'finished' } };
      });
    },
    onToolCallResultEvent: ({ event }) => {
      this._toolCalls.update((tools) => {
        const existing = tools[event.toolCallId];
        if (!existing) return tools;
        return { ...tools, [event.toolCallId]: { ...existing, status: 'completed', result: event.content } };
      });
    },
    // The client applies STATE_DELTA (JSON-Patch) for us; just mirror the result.
    onStateChanged: () => {
      this._agentState.set({ ...(this.agent.state as Record<string, unknown>) });
    },
  };

  async sendMessage(text: string): Promise<void> {
    const userMessage: ChatMessage = {
      id: `u-${crypto.randomUUID()}`,
      role: 'user',
      content: text,
    };
    this._messages.update((m) => [...m, userMessage]);
    this._status.set('running');
    this._error.set(null);

    // Add to the agent so it is sent as conversation history in RunAgentInput.
    this.agent.addMessages([{ id: userMessage.id, role: 'user', content: text }]);

    try {
      await this.agent.runAgent({}, this.subscriber);
      if (this._status() === 'running') this._status.set('finished');
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        this._status.set('idle');
        return;
      }
      this._error.set((err as Error)?.message ?? 'Agent run failed');
      this._status.set('error');
    }
  }

  stop(): void {
    this.agent.abortRun();
  }

  reset(): void {
    this._messages.set([]);
    this._toolCalls.set({});
    this._agentState.set({});
    this._status.set('idle');
    this._error.set(null);
    this.agent = this.createAgent();
  }
}
