/**
 * AG-UI Protocol event types — narrow subset used by this demo.
 *
 * Reference: https://docs.ag-ui.com / https://github.com/ag-ui-protocol/ag-ui
 */

export type AgUiEventType =
  | 'RUN_STARTED'
  | 'RUN_FINISHED'
  | 'RUN_ERROR'
  | 'TEXT_MESSAGE_START'
  | 'TEXT_MESSAGE_CONTENT'
  | 'TEXT_MESSAGE_END'
  | 'TOOL_CALL_START'
  | 'TOOL_CALL_ARGS'
  | 'TOOL_CALL_END'
  | 'TOOL_CALL_RESULT'
  | 'STATE_SNAPSHOT'
  | 'STATE_DELTA';

export interface BaseEvent {
  type: AgUiEventType;
  threadId: string;
  runId: string;
  timestamp: number;
}

export interface RunStartedEvent extends BaseEvent {
  type: 'RUN_STARTED';
}

export interface RunFinishedEvent extends BaseEvent {
  type: 'RUN_FINISHED';
}

export interface RunErrorEvent extends BaseEvent {
  type: 'RUN_ERROR';
  message: string;
  code?: string;
}

export interface TextMessageStartEvent extends BaseEvent {
  type: 'TEXT_MESSAGE_START';
  messageId: string;
  role: 'assistant' | 'tool' | 'system';
}

export interface TextMessageContentEvent extends BaseEvent {
  type: 'TEXT_MESSAGE_CONTENT';
  messageId: string;
  delta: string;
}

export interface TextMessageEndEvent extends BaseEvent {
  type: 'TEXT_MESSAGE_END';
  messageId: string;
}

export interface ToolCallStartEvent extends BaseEvent {
  type: 'TOOL_CALL_START';
  toolCallId: string;
  toolCallName: string;
  parentMessageId: string | null;
}

export interface ToolCallArgsEvent extends BaseEvent {
  type: 'TOOL_CALL_ARGS';
  toolCallId: string;
  delta: string;
}

export interface ToolCallEndEvent extends BaseEvent {
  type: 'TOOL_CALL_END';
  toolCallId: string;
}

export interface ToolCallResultEvent extends BaseEvent {
  type: 'TOOL_CALL_RESULT';
  toolCallId: string;
  messageId: string;
  content: string;
  role: 'tool';
}

export interface StateDeltaEvent extends BaseEvent {
  type: 'STATE_DELTA';
  delta: JsonPatchOperation[];
}

export interface StateSnapshotEvent extends BaseEvent {
  type: 'STATE_SNAPSHOT';
  snapshot: Record<string, unknown>;
}

export interface JsonPatchOperation {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';
  path: string;
  value?: unknown;
  from?: string;
}

export type AgUiEvent =
  | RunStartedEvent
  | RunFinishedEvent
  | RunErrorEvent
  | TextMessageStartEvent
  | TextMessageContentEvent
  | TextMessageEndEvent
  | ToolCallStartEvent
  | ToolCallArgsEvent
  | ToolCallEndEvent
  | ToolCallResultEvent
  | StateDeltaEvent
  | StateSnapshotEvent;

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

export interface RunAgentInput {
  threadId: string;
  runId: string;
  messages: { id: string; role: string; content: string }[];
  tools: unknown[];
  context: unknown[];
  state: Record<string, unknown>;
  forwardedProps: Record<string, unknown>;
}
