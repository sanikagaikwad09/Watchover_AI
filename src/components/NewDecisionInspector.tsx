import { Pause, RotateCcw, GitBranch, History, BookOpen } from 'lucide-react';
import { useState } from 'react';
import type { Socket } from 'socket.io-client';
import type { Agent } from '../types/agent.types';
import type { AgentAction } from '../types/agent.types';
import type { MockSocket } from '../services/mockSocket';
import { useAgentStore } from '../store/agentStore';
import RulesPanel from './RulesPanel';
import { ConfidenceSparkline } from './ConfidenceSparkline';
import { WhyThisMatters } from './WhyThisMatters';
import { IntegrationBadges } from './IntegrationBadges';

interface DecisionInspectorProps {
  decision: AgentAction | null;
  socket: Socket | MockSocket;
  agents: Agent[];
}

export function DecisionInspector({ decision, socket, agents }: DecisionInspectorProps) {
  const [activeTab, setActiveTab] = useState('replay');
  const [redirectInstruction, setRedirectInstruction] = useState('');
  const [editedOutput, setEditedOutput] = useState('');
  const showFeedback = useAgentStore((s) => s.showFeedback);
  const analyticsSummary = useAgentStore((s) => s.analyticsSummary);
  const selectedAgent = decision ? agents.find((agent) => agent.id === decision.agentId) ?? null : null;

  const handlePause = () => {
    if (!decision || !socket) return;
    if (!selectedAgent) return;
    const eventName = selectedAgent.status === 'paused' ? 'agent:resume' : 'agent:pause';
    try {
      socket.emit(eventName, { agentId: selectedAgent.id });
      showFeedback(selectedAgent.status === 'paused' ? 'Resume request sent...' : 'Pause request sent...', 'info');
    } catch (error) {
      console.error('[UI] Error sending pause/resume:', error);
      showFeedback('Failed to send agent control command', 'error');
    }
  };

  const handleApprove = () => {
    if (!decision || !socket) return;
    try {
      socket.emit('agent:approve', { actionId: decision.id });
      showFeedback('Approval sent...', 'success');
    } catch (error) {
      console.error('[UI] Error sending approval:', error);
      showFeedback('Failed to send approval', 'error');
    }
  };

  const handleReject = () => {
    if (!decision || !socket) return;
    try {
      socket.emit('agent:reject', { actionId: decision.id });
      showFeedback('Rejection sent...', 'warning');
    } catch (error) {
      console.error('[UI] Error sending rejection:', error);
      showFeedback('Failed to send rejection', 'error');
    }
  };

  const handleRerun = () => {
    if (!decision || !socket) return;
    try {
      const correctedOutput = editedOutput.trim() || decision.correctedOutput || decision.output;
      socket.emit('agent:rerun', {
        actionId: decision.id,
        correctedOutput,
        append: false
      });
      showFeedback('Re-run started...', 'info');
    } catch (error) {
      console.error('[UI] Error sending rerun:', error);
      showFeedback('Failed to start re-run', 'error');
    }
  };

  const handleRetry = () => {
    if (!decision || !socket) return;
    try {
      socket.emit('agent:retry', {
        actionId: decision.id,
        correctedOutput: editedOutput.trim() || undefined
      });
      showFeedback('Retry started...', 'warning');
    } catch (error) {
      console.error('[UI] Error sending retry:', error);
      showFeedback('Failed to start retry', 'error');
    }
  };

  const handleFallback = () => {
    if (!decision || !socket) return;
    try {
      socket.emit('agent:fallback', {
        actionId: decision.id,
        fallbackOption: 'Escalate to manual queue'
      });
      showFeedback('Fallback requested...', 'info');
    } catch (error) {
      console.error('[UI] Error sending fallback:', error);
      showFeedback('Failed to request fallback', 'error');
    }
  };

  const handleRedirect = () => {
    if (!decision || !socket || !redirectInstruction.trim()) return;
    const agent = agents.find((a) => a.id === decision.agentId);
    if (!agent) return;
    try {
      socket.emit('agent:redirect', {
        agentId: agent.id,
        newInstruction: redirectInstruction.trim()
      });
      showFeedback('Redirect sent...', 'info');
      setRedirectInstruction('');
    } catch (error) {
      console.error('[UI] Error sending redirect:', error);
      showFeedback('Failed to send redirect command', 'error');
    }
  };

  const getRiskLevel = (confidence: number, status: string): 'low' | 'medium' | 'high' => {
    if (status === 'failed') return 'high';
    const conf = confidence * 100;
    if (conf < 60) return 'high';
    if (conf < 80) return 'medium';
    return 'low';
  };

  if (!decision) {
    return (
      <div className="h-full flex items-center justify-center text-center p-6 bg-slate-50 dark:bg-[#050505]">
        <div>
          <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-[#161618] mx-auto mb-3 flex items-center justify-center">
            <History className="w-6 h-6 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Select an action to inspect details</p>
        </div>
      </div>
    );
  }

  const risk = getRiskLevel(decision.confidence, decision.status);
  const confidencePercent = Math.round(decision.confidence * 100);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#0F0F10] border-l border-slate-200 dark:border-[#232326]">
      <div className="p-4 border-b border-slate-200 dark:border-[#232326]">
        <p className="text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">INSPECTOR</p>
        <h3 className="font-semibold text-sm text-slate-900 dark:text-white">{decision.description}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {(() => {
            const date = new Date(decision.timestamp);
            const now = new Date();
            const diff = now.getTime() - date.getTime();
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            if (minutes < 1) return 'now';
            if (minutes < 60) return `${minutes}m ago`;
            if (hours < 24) return `${hours}h ago`;
            return `${Math.floor(diff / 86400000)}d ago`;
          })()}
        </p>
      </div>

      <div className="flex border-b border-slate-200 dark:border-[#232326] bg-slate-50 dark:bg-[#161618]" role="tablist">
        {['replay', 'controls', 'rules', 'history'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            id={`${tab}-tab`}
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`${tab}-panel`}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-500 ${
              activeTab === tab
                ? 'border-slate-900 text-slate-900 dark:border-slate-200 dark:text-slate-100'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {tab === 'replay' && 'Decision Replay'}
            {tab === 'controls' && 'Controls'}
            {tab === 'rules' && 'Rules'}
            {tab === 'history' && 'History'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4">
        {activeTab === 'replay' && (
          <div id="replay-panel" role="tabpanel" aria-labelledby="replay-tab" className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-2">What Happened</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">{decision.reasoning}</p>
              <WhyThisMatters text={decision.businessImpact} risk={risk} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-100 dark:bg-[#161618] border border-slate-200 dark:border-[#232326]">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Confidence trend</p>
                <div className="flex items-center justify-between gap-2">
                  <ConfidenceSparkline
                    values={decision.confidenceTrend ?? [confidencePercent - 4, confidencePercent - 2, confidencePercent - 1, confidencePercent, confidencePercent + 1, confidencePercent, confidencePercent + 2]}
                    className={
                      confidencePercent >= 80
                        ? 'text-green-600'
                        : confidencePercent >= 60
                          ? 'text-amber-600'
                          : 'text-red-600'
                    }
                  />
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{confidencePercent}%</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-100 dark:bg-[#161618] border border-slate-200 dark:border-[#232326]">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Integrations</p>
                <IntegrationBadges integrations={decision.integrations ?? []} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-100 dark:bg-[#161618] border border-slate-200 dark:border-[#232326]">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Approvals today</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{analyticsSummary.approvalsToday}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-100 dark:bg-[#161618] border border-slate-200 dark:border-[#232326]">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Corrections made</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{analyticsSummary.correctionsMade}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-100 dark:bg-[#161618] border border-slate-200 dark:border-[#232326]">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Interventions prevented</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {analyticsSummary.interventionsPrevented}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-3">Decision Process</h4>
              <div className="space-y-3">
                {decision.decisionTrace.map((step, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-900 dark:bg-[#161618] text-[#ffffff] flex items-center justify-center text-xs font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                        {step.step.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        {Array.isArray(step.data) ? step.data.join(', ') : step.data}
                      </p>
                      {'reasoning' in step && step.reasoning && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 italic">{step.reasoning}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-slate-100 dark:bg-[#161618] border border-slate-200 dark:border-[#232326]">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Risk Level</p>
                <p
                  className={`text-sm capitalize font-semibold ${
                    risk === 'high'
                      ? 'text-orange-700 dark:text-orange-400'
                      : risk === 'medium'
                        ? 'text-yellow-700 dark:text-yellow-400'
                        : 'text-green-700 dark:text-green-400'
                  }`}
                >
                  {risk}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-100 dark:bg-[#161618] border border-slate-200 dark:border-[#232326]">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Confidence</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{confidencePercent}%</p>
              </div>
            </div>

            {decision.output && (
              <div>
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-2">Output</h4>
                <div className="p-3 rounded-lg bg-slate-100 dark:bg-[#161618] border border-slate-200 dark:border-[#232326] text-sm text-slate-700 dark:text-slate-300">
                  {decision.output}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'controls' && (
          <div id="controls-panel" role="tabpanel" aria-labelledby="controls-tab" className="space-y-3">
            <button
              onClick={handlePause}
              aria-label={selectedAgent?.status === 'paused' ? 'Resume agent execution' : 'Pause agent execution'}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 hover:bg-red-200 dark:hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-[#050505] transition-colors text-red-700 dark:text-red-300"
            >
              <Pause className="w-4 h-4 flex-shrink-0" />
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold">{selectedAgent?.status === 'paused' ? 'Resume Agent' : 'Pause Agent'}</p>
                <p className="text-xs opacity-75">
                  {selectedAgent?.status === 'paused' ? 'Continue current work' : 'Stop all current actions'}
                </p>
              </div>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleApprove}
                aria-label="Approve this agent action"
                className="flex items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-100 p-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-[#050505] dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={handleReject}
                aria-label="Reject this agent action"
                className="flex items-center justify-center gap-2 rounded-lg border border-red-300 bg-red-100 p-3 text-sm font-semibold text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-[#050505] dark:border-red-800 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 transition-colors"
              >
                Reject
              </button>
            </div>

              <button
                onClick={handleRerun}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-100 dark:bg-[#161618] border border-slate-300 dark:border-[#232326] hover:bg-slate-200 dark:hover:bg-[#232326] focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-[#050505] transition-colors text-slate-700 dark:text-slate-200"
              >
              <RotateCcw className="w-4 h-4 flex-shrink-0" />
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold">Fix & Re-run</p>
                <p className="text-xs opacity-75">Adjust parameters and retry</p>
              </div>
            </button>

            <div className="rounded-lg border border-slate-200 dark:border-[#232326] p-3">
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">Edited output</label>
              <textarea
                value={editedOutput}
                onChange={(e) => setEditedOutput(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#232326] bg-white dark:bg-[#161618] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 resize-none"
                placeholder="Optional corrected output to use for retry / rerun"
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={handleRetry}
                  className="rounded-lg border border-slate-300 dark:border-[#232326] bg-white dark:bg-[#161618] px-3 py-2 text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-[#232326] focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-[#050505] transition-colors"
                >
                  Retry
                </button>
                <button
                  onClick={handleFallback}
                  className="rounded-lg border border-slate-300 dark:border-[#232326] bg-white dark:bg-[#161618] px-3 py-2 text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-[#232326] focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-[#050505] transition-colors"
                >
                  Fallback
                </button>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-[#232326] pt-3">
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">Redirect Instruction</label>
              <textarea
                value={redirectInstruction}
                onChange={(e) => setRedirectInstruction(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#232326] bg-white dark:bg-[#161618] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 resize-none"
                placeholder="Enter new instruction for the agent..."
              />
              <button
                onClick={handleRedirect}
                disabled={!redirectInstruction.trim()}
                className="w-full mt-2 flex items-center gap-3 p-3 rounded-lg border border-slate-300 dark:border-[#232326] bg-white dark:bg-[#161618] hover:bg-slate-50 dark:hover:bg-[#232326] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-[#161618] focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-[#050505] transition-colors"
              >
                <GitBranch className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold">Send Redirect</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Change agent direction</p>
                </div>
              </button>
            </div>

              <button
                onClick={() => setActiveTab('rules')}
                className="w-full rounded-lg border border-slate-300 dark:border-[#232326] bg-white dark:bg-[#161618] px-3 py-3 text-sm font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-[#232326] focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-[#050505] transition-colors"
              >
              <div className="flex items-center justify-center gap-2">
                <BookOpen className="w-4 h-4" />
                Add Rule From Decision
              </div>
            </button>
          </div>
        )}

        {activeTab === 'rules' && selectedAgent && socket && (
          <div id="rules-panel" role="tabpanel" aria-labelledby="rules-tab">
            <RulesPanel agent={selectedAgent} socket={socket} />
          </div>
        )}

        {activeTab === 'history' && (
          <div id="history-panel" role="tabpanel" aria-labelledby="history-tab" className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-100 dark:bg-[#161618] border border-slate-200 dark:border-[#232326]">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Action ID</p>
              <p className="text-sm text-slate-900 dark:text-white font-mono break-all">{decision.id}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-100 dark:bg-[#161618] border border-slate-200 dark:border-[#232326]">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Agent ID</p>
              <p className="text-sm text-slate-900 dark:text-white font-mono">{decision.agentId}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-100 dark:bg-[#161618] border border-slate-200 dark:border-[#232326]">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Status</p>
              <p className="text-sm text-slate-900 dark:text-white capitalize">{decision.status}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-100 dark:bg-[#161618] border border-slate-200 dark:border-[#232326]">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Retry Count</p>
              <p className="text-sm text-slate-900 dark:text-white">{decision.retryCount}</p>
            </div>
            {decision.errorReason && (
              <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800">
                <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">Error</p>
                <p className="text-sm text-red-600 dark:text-red-400">{decision.errorReason}</p>
              </div>
            )}
            {decision.fallbackOption && (
              <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-800">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">Fallback</p>
                <p className="text-sm text-amber-600 dark:text-amber-400">{decision.fallbackOption}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
