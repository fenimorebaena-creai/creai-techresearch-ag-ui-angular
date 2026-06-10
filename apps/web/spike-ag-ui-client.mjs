// S2 verification: replicate AgentService's subscriber reduction outside Angular
// and assert it reconstructs the UI state correctly. Run with the API on :8001.
import { HttpAgent } from '@ag-ui/client';

const agent = new HttpAgent({ url: 'http://localhost:8001/agent', threadId: 't-spike' });

// Mirror of the service's signals.
let messages = [];
let toolCalls = {};
let agentState = {};
let status = 'idle';

const sub = {
  onRunStartedEvent: () => (status = 'running'),
  onRunFinishedEvent: () => (status = 'finished'),
  onRunErrorEvent: ({ event }) => (status = 'error'),
  onTextMessageStartEvent: ({ event }) =>
    (messages = [...messages, { id: event.messageId, role: 'assistant', content: '', pending: true }]),
  onTextMessageContentEvent: ({ event }) =>
    (messages = messages.map((m) => (m.id === event.messageId ? { ...m, content: m.content + event.delta } : m))),
  onTextMessageEndEvent: ({ event }) =>
    (messages = messages.map((m) => (m.id === event.messageId ? { ...m, pending: false } : m))),
  onToolCallStartEvent: ({ event }) =>
    (toolCalls = { ...toolCalls, [event.toolCallId]: { id: event.toolCallId, name: event.toolCallName, args: '', status: 'running' } }),
  onToolCallArgsEvent: ({ event }) => {
    const e = toolCalls[event.toolCallId];
    if (e) toolCalls = { ...toolCalls, [event.toolCallId]: { ...e, args: e.args + event.delta } };
  },
  onToolCallEndEvent: ({ event }) => {
    const e = toolCalls[event.toolCallId];
    if (e) toolCalls = { ...toolCalls, [event.toolCallId]: { ...e, status: 'finished' } };
  },
  onToolCallResultEvent: ({ event }) => {
    const e = toolCalls[event.toolCallId];
    if (e) toolCalls = { ...toolCalls, [event.toolCallId]: { ...e, status: 'completed', result: event.content } };
  },
  onStateChanged: () => (agentState = { ...agent.state }),
};

messages = [{ id: 'u1', role: 'user', content: 'What is the overtime rate?' }];
agent.addMessages([{ id: 'u1', role: 'user', content: 'What is the overtime rate?' }]);
await agent.runAgent({}, sub);

const tc = Object.values(toolCalls);
const ok = (label, cond) => console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${label}`);
console.log('\n=== reconstructed UI state ===');
console.log('status            :', status);
console.log('messages          :', messages.map((m) => `${m.role}${m.pending ? '(pending)' : ''}`).join(', '));
console.log('final assistant   :', messages.at(-1)?.content?.slice(0, 70), '...');
console.log('toolCall          :', tc.map((t) => `${t.name}[${t.status}] args=${t.args}`).join(' | '));
console.log('citedClauses      :', Array.isArray(agentState.citedClauses) ? agentState.citedClauses.length : agentState.citedClauses);
console.log('\n=== assertions ===');
ok('status finished', status === 'finished');
ok('2 assistant messages, none pending', messages.filter((m) => m.role === 'assistant').length === 2 && messages.every((m) => !m.pending));
ok('tool call completed with result', tc.length === 1 && tc[0].status === 'completed' && !!tc[0].result);
ok('tool args streamed as JSON', tc[0]?.args?.includes('query'));
ok('state.citedClauses == 2 (JSON-Patch applied)', Array.isArray(agentState.citedClauses) && agentState.citedClauses.length === 2);
