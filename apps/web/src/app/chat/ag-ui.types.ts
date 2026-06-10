/**
 * UI-facing view models for the chat.
 *
 * The AG-UI Protocol event types (RunStarted, TextMessage*, ToolCall*,
 * StateDelta, …) and `RunAgentInput` now come from the first-party
 * `@ag-ui/client` / `@ag-ui/core` packages, so they are no longer redeclared
 * here — only the shapes the components render.
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  pending?: boolean;
}

export interface ToolCall {
  id: string;
  name: string;
  args: string;
  status: 'running' | 'finished' | 'completed';
  result?: string;
}
