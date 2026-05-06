import { AlertTriangle, CheckCircle2, Clock, AlertCircle, Check, X } from 'lucide-react';
import type { AgentAction } from '../types/agent.types';

interface ActivityCardProps {
  action: AgentAction;
  isSelected: boolean;
  onClick: () => void;
}

const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

export function ActivityCard({ action, isSelected, onClick }: ActivityCardProps) {
  const getRiskLevel = (confidence: number, status: string): 'low' | 'medium' | 'high' => {
    if (status === 'failed') return 'high';
    const conf = confidence * 100;
    if (conf < 60) return 'high';
    if (conf < 80) return 'medium';
    return 'low';
  };

  const risk = getRiskLevel(action.confidence, action.status);

  const riskConfig = {
    low: {
      badge: 'text-green-700 bg-green-100 dark:bg-green-900/40 dark:text-green-300',
      border: 'border-l-green-600',
    },
    medium: {
      badge: 'text-amber-700 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300',
      border: 'border-l-amber-600',
    },
    high: {
      badge: 'text-red-700 bg-red-100 dark:bg-red-900/40 dark:text-red-300',
      border: 'border-l-red-600',
    }
  };

  const config = riskConfig[risk];
  const confidencePercent = Math.round(action.confidence * 100);

  return (
    <button
      onClick={onClick}
      aria-label={`${action.description} - ${action.status} - ${Math.round(action.confidence * 100)}% confidence - ${formatTime(action.timestamp)}`}
      className={`w-full text-left p-4 rounded-lg border border-l-[5px] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-slate-500 dark:focus:ring-offset-[#050505] ${
        isSelected
          ? `bg-white dark:bg-[#0F0F10] border-slate-300 dark:border-[#232326] ${config.border}`
          : `bg-white dark:bg-[#0F0F10] border-slate-200 dark:border-[#232326] ${config.border} hover:bg-slate-50 dark:hover:bg-[#161618]`
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1">{action.description}</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{action.reasoning}</p>
        </div>
        <div className="flex-shrink-0 flex flex-col items-center gap-1 mt-0.5">
          <div className="flex items-center gap-1">
            {action.status === 'done' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
            {action.status === 'pending' && <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
            {action.status === 'interrupted' && <AlertCircle className="w-4 h-4 text-yellow-600" />}
            {action.status === 'failed' && <AlertTriangle className="w-4 h-4 text-red-600" />}
            {action.approvalStatus === 'approved' && <Check className="w-4 h-4 text-green-600 bg-green-100 dark:bg-green-900/40 rounded-full p-0.5" />}
            {action.approvalStatus === 'rejected' && <X className="w-4 h-4 text-red-600 bg-red-100 dark:bg-red-900/40 rounded-full p-0.5" />}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <span className={`text-xs font-bold px-2.5 py-1 rounded ${config.badge}`}>{risk.toUpperCase()}</span>
        <span className="text-xs text-slate-600 dark:text-slate-400">Confidence: {confidencePercent}%</span>
        <span className="text-xs text-slate-500 dark:text-slate-500 ml-auto">{formatTime(action.timestamp)}</span>
      </div>
    </button>
  );
}
