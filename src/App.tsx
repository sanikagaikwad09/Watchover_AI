import { useEffect, useState } from 'react';
import { AlertCircle, Search } from 'lucide-react';
import { useAgentSocket } from './hooks/useAgentSocket';
import { useAgentStore } from './store/agentStore';
import { LoginScreen } from './components/NewLoginScreen';
import { TopBar } from './components/NewTopBar';
import { AgentCard } from './components/NewAgentCard';
import { ActivityCard } from './components/NewActivityCard';
import { DecisionInspector } from './components/NewDecisionInspector';
import type { Agent, AgentAction } from './types/agent.types';

function App(): JSX.Element {
  const socket = useAgentSocket();
  const isAuthenticated = useAgentStore((s) => s.isAuthenticated);
  const agents = useAgentStore((s) => s.agents);
  const actions = useAgentStore((s) => s.actions);
  const selectedActionId = useAgentStore((s) => s.selectedActionId);
  const openDecisionReplay = useAgentStore((s) => s.openDecisionReplay);
  const closeDecisionReplay = useAgentStore((s) => s.closeDecisionReplay);
  const showFeedback = useAgentStore((s) => s.showFeedback);
  const feedbackMessage = useAgentStore((s) => s.feedbackMessage);
  const feedbackTone = useAgentStore((s) => s.feedbackTone);
  const clearFeedback = useAgentStore((s) => s.clearFeedback);
  const theme = useAgentStore((s) => s.theme);
  const connectionStatus = useAgentStore((s) => s.connectionStatus);

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionOverride, setSelectedActionOverride] = useState<string | null>(null);

  // Cleanup feedback message
  useEffect(() => {
    if (!feedbackMessage) return;
    const timeout = window.setTimeout(() => clearFeedback(), 2600);
    return () => window.clearTimeout(timeout);
  }, [clearFeedback, feedbackMessage]);

  // Auto-select first agent
  useEffect(() => {
    if (agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  useEffect(() => {
    if (!selectedAgentId) {
      return;
    }

    const latestAgentAction = actions.find((action) => action.agentId === selectedAgentId) ?? null;
    if (latestAgentAction && selectedActionOverride !== latestAgentAction.id) {
      setSelectedActionOverride(latestAgentAction.id);
      openDecisionReplay(latestAgentAction.id);
    }
  }, [actions, openDecisionReplay, selectedActionOverride, selectedAgentId]);

  // Get filtered actions
  const filteredActions = actions
    .filter((action) => {
      if (selectedAgentId && action.agentId !== selectedAgentId) return false;
      if (!searchQuery.trim()) return true;
      const query = searchQuery.trim().toLowerCase();
      return (
        action.description.toLowerCase().includes(query) ||
        action.reasoning.toLowerCase().includes(query) ||
        action.actionType.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Separate high-risk from regular actions
  const highRiskActions = filteredActions.filter((a) => {
    const conf = a.confidence * 100;
    return a.status === 'failed' || conf < 70 || (a.confidence < 0.8);
  });

  const regularActions = filteredActions.filter((a) => !highRiskActions.includes(a));

  // Get selected action
  const activeSelectedActionId = selectedActionOverride || selectedActionId;
  const selectedAction = actions.find((a) => a.id === activeSelectedActionId) || null;

  useEffect(() => {
    // Apply theme class to html element and persist to localStorage
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [theme]);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const feedbackVisible = Boolean(feedbackMessage);
  const feedbackClass =
    feedbackTone === 'success'
      ? 'border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
      : feedbackTone === 'error'
        ? 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
        : feedbackTone === 'warning'
          ? 'border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
          : 'border-slate-200 dark:border-[#232326] bg-slate-50 dark:bg-[#161618] text-slate-700 dark:text-slate-300';

  return (
    <div className="h-screen flex flex-col bg-background dark:bg-[#050505] text-foreground dark:text-white">
      <TopBar />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Agent Navigator */}
        <div className="w-64 border-r border-border dark:border-[#232326] flex flex-col bg-card dark:bg-[#0F0F10]">
          <div className="h-14 px-4 border-b border-border dark:border-[#232326] flex items-center">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">AGENTS</p>
              <h2 className="text-base font-semibold mt-0.5">Active Processes</h2>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {agents.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-4">
                <p>Loading agents...</p>
              </div>
            ) : (
              agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  isSelected={selectedAgentId === agent.id}
                  onClick={() => {
                    console.log('[UI] Agent card clicked:', agent.id);
                    setSelectedAgentId(agent.id);
                  }}
                />
              ))
            )}
          </div>

          <div className="p-3 border-t border-border dark:border-[#232326] text-xs text-muted-foreground">
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected'
                    ? 'bg-green-600'
                    : connectionStatus === 'reconnecting'
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                }`}
              />
              <span className="capitalize">{connectionStatus}</span>
            </div>
            <p className="text-[11px]">Real-time sync enabled</p>
          </div>
        </div>

        {/* Center - Activity Timeline */}
        <div className="flex-1 flex flex-col bg-background dark:bg-[#050505] overflow-hidden">
          <div className="h-14 px-6 border-b border-border dark:border-[#232326] bg-card dark:bg-[#0F0F10] flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">CONTROL LAYER</p>
              <h2 className="text-base font-semibold mt-0.5">Activity Timeline</h2>
            </div>
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search actions..."
                className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-border dark:border-[#232326] bg-background dark:bg-[#161618] text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Needs Attention Section */}
            {highRiskActions.length > 0 && (
              <div className="p-4 border-b border-border dark:border-[#232326] bg-card dark:bg-[#0F0F10]">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <h3 className="font-semibold">Needs Attention</h3>
                  <span className="text-sm text-muted-foreground">({highRiskActions.length})</span>
                </div>
                <div className="space-y-2">
                  {highRiskActions.map((action) => (
                    <ActivityCard
                      key={action.id}
                      action={action}
                      isSelected={activeSelectedActionId === action.id}
                      onClick={() => {
                        console.log('[UI] Action card clicked:', action.id);
                        setSelectedAgentId(action.agentId);
                        setSelectedActionOverride(action.id);
                        openDecisionReplay(action.id);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Activities */}
            {regularActions.length > 0 ? (
              <div className="p-4">
                <h3 className="font-semibold mb-3">Recent Activity</h3>
                <div className="space-y-2">
                  {regularActions.map((action) => (
                    <ActivityCard
                      key={action.id}
                      action={action}
                      isSelected={activeSelectedActionId === action.id}
                      onClick={() => {
                        console.log('[UI] Action card clicked:', action.id);
                        setSelectedAgentId(action.agentId);
                        setSelectedActionOverride(action.id);
                        openDecisionReplay(action.id);
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                <p className="text-sm">{actions.length === 0 ? 'Waiting for agent actions...' : 'No matching actions'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Decision Inspector */}
        <div className="w-96 border-l border-border dark:border-[#232326] flex flex-col">
          <DecisionInspector decision={selectedAction} socket={socket} agents={agents} />
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div
          className={`fixed bottom-6 right-6 max-w-md border rounded-lg p-4 shadow-lg transition-all duration-300 ${
            feedbackVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
          } ${feedbackClass}`}
        >
          <p className="text-sm font-medium">{feedbackMessage}</p>
        </div>
      )}
    </div>
  );
}

export default App;
