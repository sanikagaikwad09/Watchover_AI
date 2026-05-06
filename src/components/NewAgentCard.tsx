import { Play, Pause } from 'lucide-react';
import type { Agent } from '../types/agent.types';

interface AgentCardProps {
  agent: Agent;
  isSelected: boolean;
  onClick: () => void;
}

export function AgentCard({ agent, isSelected, onClick }: AgentCardProps) {
  const trustColor =
    agent.trustScore >= 80 ? 'bg-green-600' : agent.trustScore >= 60 ? 'bg-yellow-600' : 'bg-red-600';

  return (
    <button
      onClick={onClick}
      aria-label={`${agent.name} - ${agent.status} - ${Math.round(agent.trustScore)}% trust score - ${agent.actionsCount} actions`}
      className={`w-full text-left p-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-slate-500 dark:focus:ring-offset-[#050505] ${
        isSelected
          ? 'bg-slate-100 dark:bg-[#0F0F10] border-slate-300 dark:border-[#232326]'
          : 'bg-white dark:bg-[#0F0F10] border-slate-200 dark:border-[#232326] hover:border-slate-400 dark:hover:border-[#2F2F33]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-900 dark:text-white">{agent.name}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
            {agent.lastAction || 'Idle'}
          </p>
        </div>
        {agent.status === 'running' ? (
          <Play className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
        ) : (
          <Pause className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        )}
      </div>

      <div className="mt-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Trust</span>
          <span className="text-xs font-semibold text-slate-900 dark:text-white">{Math.round(agent.trustScore)}%</span>
        </div>
        <div className="h-2 bg-slate-200 dark:bg-[#232326] rounded-full overflow-hidden">
          <div className={`h-full ${trustColor} rounded-full`} style={{ width: `${agent.trustScore}%` }} />
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
        {agent.actionsCount} actions • {agent.status}
      </p>
    </button>
  );
}
