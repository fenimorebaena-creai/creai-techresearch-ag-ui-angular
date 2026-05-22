import { Injectable, signal } from '@angular/core';
import {
  AgUiEvent,
  ChatMessage,
  JsonPatchOperation,
  RunAgentInput,
  ToolCall,
} from './ag-ui.types';

const AGENT_URL = 'http://localhost:8000/agent';

/**
 * Signal-based AG-UI client.
 *
 * Subscribes to a POST/SSE stream and reduces the standard AG-UI events into:
 *   - messages()   : array of chat messages (user + assistant streamed deltas)
 *   - toolCalls()  : map of ToolCall keyed by toolCallId
 *   - agentState() : shared agent state (applied JSON-Patch deltas)
 *   - status()     : 'idle' | 'running' | 'error' | 'finished'
 *   - error()      : last error message
 *
 * We do not depend on EventSource because AG-UI uses POST + SSE; we use
 * fetch() + ReadableStream and parse the wire format manually.
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

  private abortController: AbortController | null = null;
  private threadId = `t-${crypto.randomUUID()}`;

  async sendMessage(text: string): Promise<void> {
    const userMessage: ChatMessage = {
      id: `u-${crypto.randomUUID()}`,
      role: 'user',
      content: text,
    };
    this._messages.update((m) => [...m, userMessage]);
    this._status.set('running');
    this._error.set(null);

    const input: RunAgentInput = {
      threadId: this.threadId,
      runId: `r-${crypto.randomUUID()}`,
      messages: this._messages().map((m) => ({ id: m.id, role: m.role, content: m.content })),
      tools: [],
      context: [],
      state: this._agentState(),
      forwardedProps: {},
    };

    this.abortController = new AbortController();

    try {
      const response = await fetch(AGENT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(input),
        signal: this.abortController.signal,
      });
      if (!response.ok || !response.body) {
        throw new Error(`Agent returned HTTP ${response.status}`);
      }
      for await (const event of parseSseStream(response.body)) {
        this.handleEvent(event);
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        this._status.set('idle');
        return;
      }
      this._error.set((err as Error).message);
      this._status.set('error');
    }
  }

  stop(): void {
    this.abortController?.abort();
  }

  reset(): void {
    this._messages.set([]);
    this._toolCalls.set({});
    this._agentState.set({});
    this._status.set('idle');
    this._error.set(null);
    this.threadId = `t-${crypto.randomUUID()}`;
  }

  private handleEvent(event: AgUiEvent): void {
    switch (event.type) {
      case 'RUN_STARTED':
        this._status.set('running');
        break;
      case 'RUN_FINISHED':
        this._status.set('finished');
        break;
      case 'RUN_ERROR':
        this._error.set(event.message);
        this._status.set('error');
        break;
      case 'TEXT_MESSAGE_START':
        this._messages.update((messages) => [
          ...messages,
          { id: event.messageId, role: event.role, content: '', pending: true },
        ]);
        break;
      case 'TEXT_MESSAGE_CONTENT':
        this._messages.update((messages) =>
          messages.map((m) =>
            m.id === event.messageId ? { ...m, content: m.content + event.delta } : m,
          ),
        );
        break;
      case 'TEXT_MESSAGE_END':
        this._messages.update((messages) =>
          messages.map((m) => (m.id === event.messageId ? { ...m, pending: false } : m)),
        );
        break;
      case 'TOOL_CALL_START':
        this._toolCalls.update((tools) => ({
          ...tools,
          [event.toolCallId]: {
            id: event.toolCallId,
            name: event.toolCallName,
            args: '',
            status: 'running',
          },
        }));
        break;
      case 'TOOL_CALL_ARGS':
        this._toolCalls.update((tools) => {
          const existing = tools[event.toolCallId];
          if (!existing) return tools;
          return {
            ...tools,
            [event.toolCallId]: { ...existing, args: existing.args + event.delta },
          };
        });
        break;
      case 'TOOL_CALL_END':
        this._toolCalls.update((tools) => {
          const existing = tools[event.toolCallId];
          if (!existing) return tools;
          return {
            ...tools,
            [event.toolCallId]: { ...existing, status: 'finished' },
          };
        });
        break;
      case 'TOOL_CALL_RESULT':
        this._toolCalls.update((tools) => {
          const existing = tools[event.toolCallId];
          if (!existing) return tools;
          return {
            ...tools,
            [event.toolCallId]: { ...existing, status: 'completed', result: event.content },
          };
        });
        break;
      case 'STATE_SNAPSHOT':
        this._agentState.set({ ...event.snapshot });
        break;
      case 'STATE_DELTA':
        this._agentState.update((state) => applyJsonPatch(state, event.delta));
        break;
    }
  }
}

/**
 * Apply a minimal subset of RFC 6902 JSON-Patch operations.
 *
 * The demo only emits `add` and `replace` operations on top-level paths
 * (`/lastUserMessage`, `/citedClauses`) so a tiny implementation suffices.
 * Production code should use a real JSON-Patch library.
 */
function applyJsonPatch(
  state: Record<string, unknown>,
  patches: JsonPatchOperation[],
): Record<string, unknown> {
  const next = { ...state };
  for (const patch of patches) {
    const key = patch.path.replace(/^\//, '');
    if (patch.op === 'add' || patch.op === 'replace') {
      next[key] = patch.value;
    } else if (patch.op === 'remove') {
      delete next[key];
    }
  }
  return next;
}

/**
 * Parse an SSE byte stream into a sequence of typed AG-UI events.
 *
 * Each SSE frame is delimited by a blank line. Within a frame we honour:
 *   - `event: <name>` lines for the event type
 *   - `data: <json>` lines for the JSON payload (concatenated if multiple)
 *
 * Lines starting with `:` are comments and skipped.
 */
async function* parseSseStream(body: ReadableStream<Uint8Array>): AsyncGenerator<AgUiEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      if (buffer.trim()) yield* drainFrame(buffer);
      return;
    }
    buffer += decoder.decode(value, { stream: true });

    let frameEnd: number;
    while ((frameEnd = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, frameEnd);
      buffer = buffer.slice(frameEnd + 2);
      yield* drainFrame(frame);
    }
  }
}

function* drainFrame(frame: string): Generator<AgUiEvent> {
  const lines = frame.split('\n');
  let eventName: string | null = null;
  let dataBuffer = '';
  for (const line of lines) {
    if (!line || line.startsWith(':')) continue;
    if (line.startsWith('event: ')) {
      eventName = line.slice(7).trim();
    } else if (line.startsWith('data: ')) {
      dataBuffer += line.slice(6);
    }
  }
  if (!eventName || !dataBuffer) return;
  try {
    const parsed = JSON.parse(dataBuffer) as AgUiEvent;
    yield parsed;
  } catch (err) {
    console.warn('AG-UI: failed to parse event payload', { eventName, dataBuffer, err });
  }
}
