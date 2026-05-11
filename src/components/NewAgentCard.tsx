import { Play, Pause } from 'lucide-react';
import type { Agent } from '../types/agent.types';
import { ConfidenceSparkline } from './ConfidenceSparkline';

interface AgentCardProps {
  agent: Agent;
  isSelected: boolean;
  onClick: () => void;
}

export function AgentCard({ agent, isSelected, onClick }: AgentCardProps) {
  const trustTrend =
    agent.trustTrend ?? [agent.trustScore - 4, agent.trustScore - 2, agent.trustScore - 1, agent.trustScore, agent.trustScore + 1, agent.trustScore, agent.trustScore + 2, agent.trustScore];
  const trustColor = agent.trustScore >= 80 ? 'text-green-600' : agent.trustScore >= 60 ? 'text-yellow-600' : 'text-red-600';

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

      <div className="mt-2.5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Trust trend</p>
          <div className="mt-1 flex items-center gap-2">
            <ConfidenceSparkline values={trustTrend} className={trustColor} />
            <span className="text-xs font-semibold text-slate-900 dark:text-white">{Math.round(agent.trustScore)}%</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
        {agent.actionsCount} actions • {agent.status}
      </p>
    </button>
  );
}
