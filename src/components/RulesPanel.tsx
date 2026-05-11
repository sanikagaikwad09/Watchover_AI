import type { Socket } from 'socket.io-client';
import { useMemo, useState } from 'react';
import { useAgentStore } from '../store/agentStore';
import type { Agent } from '../types/agent.types';
import type { MockSocket } from '../services/mockSocket';

interface RulesPanelProps {
  agent: Agent;
  socket: Socket | MockSocket;
}

function RulesPanel({ agent, socket }: RulesPanelProps): JSX.Element {
  const rules = useAgentStore((state) => state.rules);
  const [condition, setCondition] = useState('');
  const [instruction, setInstruction] = useState('');

  const agentRules = useMemo(
    () => rules.filter((rule) => rule.agentId === agent.id),
    [agent.id, rules],
  );

  const createRule = (): void => {
    if (!condition.trim() || !instruction.trim()) {
      return;
    }
    socket.emit('rule:create', {
      agentId: agent.id,
      condition: condition.trim(),
      instruction: instruction.trim(),
    });
    setCondition('');
    setInstruction('');
    const showFeedback = useAgentStore.getState().showFeedback;
    showFeedback('Rule saved successfully', 'success');
  };

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-weak bg-bg p-3 dark:bg-[#161618]">
        <h4 className="mb-2 text-sm font-semibold text-text-primary">Teach Agent Rule</h4>
        <input
          value={condition}
          onChange={(event) => setCondition(event.target.value)}
          placeholder="Condition (e.g. Q3 meeting requests)"
          className="mb-2 w-full rounded-md border border-weak bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-slate-500 focus:ring-2 focus:ring-slate-500 focus:outline-none dark:bg-[#161618]"
        />
        <textarea
          value={instruction}
          onChange={(event) => setInstruction(event.target.value)}
          rows={2}
          placeholder="Instruction (e.g. propose 2 alternate slots first)"
          className="mb-2 w-full rounded-md border border-weak bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-slate-500 focus:ring-2 focus:ring-slate-500 focus:outline-none dark:bg-[#161618]"
        />
        <button
          type="button"
          onClick={createRule}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-[#ffffff] hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors"
        >
          Save rule
        </button>
      </div>

      <div className="space-y-2">
        {agentRules.length === 0 ? (
          <p className="text-sm text-text-secondary">No active rules for this agent.</p>
        ) : (
          agentRules.map((rule) => (
            <div key={rule.id} className="rounded-md border border-weak bg-bg p-3 dark:bg-[#161618]">
              <p className="text-xs text-text-secondary">If {rule.condition}</p>
              <p className="mt-1 text-sm text-text-primary">{rule.instruction}</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => socket.emit('rule:toggle', { id: rule.id })}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors dark:border-[#232326] dark:hover:bg-[#232326]"
                >
                  {rule.enabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  type="button"
                  onClick={() => socket.emit('rule:delete', { id: rule.id })}
                  className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors dark:border-red-800 dark:hover:bg-red-900/20"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default RulesPanel;
