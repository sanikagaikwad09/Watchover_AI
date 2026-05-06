import { create } from 'zustand';
import type { Agent, AgentAction, AgentRule } from '../types/agent.types';

interface AgentState {
  agents: Agent[];
  actions: AgentAction[];
  rules: AgentRule[];
  connectionStatus: 'connected' | 'reconnecting' | 'disconnected';
  hasReceivedFirstEvent: boolean;
  feedbackMessage: string | null;
  feedbackTone: 'info' | 'success' | 'warning' | 'error';
  processingActionIds: string[];
  interruptedAgentId: string | null;
  selectedActionId: string | null;
  pendingPauseRollback: Record<string, Agent['status']>;
  selectedAgentTab: 'actions' | 'rules';
  setAgents: (agents: Agent[]) => void;
  setActions: (actions: AgentAction[]) => void;
  upsertAgent: (agent: Agent) => void;
  addAction: (action: AgentAction) => void;
  setRules: (rules: AgentRule[]) => void;
  upsertAction: (action: AgentAction) => void;
  removeAction: (actionId: string) => void;
  openInterruptPanel: (agentId: string) => void;
  closeInterruptPanel: () => void;
  openDecisionReplay: (actionId: string) => void;
  closeDecisionReplay: () => void;
  optimisticPause: (agentId: string) => void;
  confirmPause: (agentId: string, status: Agent['status']) => void;
  rollbackPause: (agentId: string) => void;
  applyRerun: (actionId: string, correctedOutput: string, strategy: 'replace' | 'append') => void;
  markRetry: (actionId: string, status: AgentAction['status']) => void;
  markFallback: (actionId: string, fallbackOption: string) => void;
  approveAction: (actionId: string) => void;
  rejectAction: (actionId: string) => void;
  setAgentTab: (tab: 'actions' | 'rules') => void;
  setConnectionStatus: (status: AgentState['connectionStatus']) => void;
  showFeedback: (message: string, tone?: AgentState['feedbackTone']) => void;
  clearFeedback: () => void;
  startProcessingAction: (actionId: string) => void;
  stopProcessingAction: (actionId: string) => void;
  /* Theme and auth */
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isAuthenticated: boolean;
  userName: string;
  login: (username: string) => void;
  logout: () => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  actions: [],
  rules: [],
  connectionStatus: 'disconnected',
  hasReceivedFirstEvent: false,
  feedbackMessage: null,
  feedbackTone: 'info',
  processingActionIds: [],
  interruptedAgentId: null,
  selectedActionId: null,
  pendingPauseRollback: {},
  selectedAgentTab: 'actions',
  setAgents: (agents) => set({ agents, hasReceivedFirstEvent: true }),
  setActions: (actions) =>
    set((state) => ({
      hasReceivedFirstEvent: true,
      actions,
      agents: state.agents.map((agent) => {
        const latestAction = actions.find((action) => action.agentId === agent.id);
        if (!latestAction) {
          return agent;
        }
        return {
          ...agent,
          lastAction: latestAction.description,
          actionsCount: Math.max(agent.actionsCount, actions.filter((action) => action.agentId === agent.id).length),
        };
      }),
    })),
  upsertAgent: (agent) =>
    set((state) => {
      const index = state.agents.findIndex((entry) => entry.id === agent.id);
      if (index === -1) {
        return { agents: [...state.agents, agent] };
      }
      const next = [...state.agents];
      next[index] = agent;
      return { agents: next };
    }),
  addAction: (action) => {
    set((state) => ({
      hasReceivedFirstEvent: true,
      actions: [action, ...state.actions].slice(0, 150),
      agents: state.agents.map((agent) =>
        agent.id === action.agentId
          ? {
              ...agent,
              lastAction: action.description,
              actionsCount: agent.actionsCount + 1,
            }
          : agent,
      ),
    }));
  },
  setRules: (rules) => set({ rules }),
  upsertAction: (action) =>
    set((state) => {
      const index = state.actions.findIndex((entry) => entry.id === action.id);
      if (index === -1) {
        return {
          actions: [action, ...state.actions].slice(0, 150),
        };
      }

      const next = [...state.actions];
      next[index] = action;
      return { actions: next };
    }),
  removeAction: (actionId) =>
    set((state) => ({
      actions: state.actions.filter((action) => action.id !== actionId),
    })),
  openInterruptPanel: (agentId) => set({ interruptedAgentId: agentId }),
  closeInterruptPanel: () => set({ interruptedAgentId: null }),
  openDecisionReplay: (actionId) => set({ selectedActionId: actionId }),
  closeDecisionReplay: () => set({ selectedActionId: null }),
  optimisticPause: (agentId) => {
    const previous = get().agents.find((agent) => agent.id === agentId)?.status;
    if (!previous) {
      return;
    }
    set((state) => ({
      feedbackMessage: 'Pausing agent...',
      feedbackTone: 'warning',
      pendingPauseRollback: {
        ...state.pendingPauseRollback,
        [agentId]: previous,
      },
      agents: state.agents.map((agent) =>
        agent.id === agentId ? { ...agent, status: 'paused' } : agent,
      ),
    }));
  },
  confirmPause: (agentId, status) =>
    set((state) => {
      const rest = { ...state.pendingPauseRollback };
      delete rest[agentId];
      return {
        feedbackMessage: status === 'paused' ? 'Agent paused.' : 'Agent resumed.',
        feedbackTone: status === 'paused' ? 'success' : 'info',
        pendingPauseRollback: rest,
        agents: state.agents.map((agent) =>
          agent.id === agentId ? { ...agent, status } : agent,
        ),
      };
    }),
  rollbackPause: (agentId) =>
    set((state) => {
      const previous = state.pendingPauseRollback[agentId];
      const rest = { ...state.pendingPauseRollback };
      delete rest[agentId];
      if (!previous) {
        return { pendingPauseRollback: rest };
      }
      return {
        feedbackMessage: 'Pause could not be completed. Restored previous state.',
        feedbackTone: 'error',
        pendingPauseRollback: rest,
        agents: state.agents.map((agent) =>
          agent.id === agentId ? { ...agent, status: previous } : agent,
        ),
      };
    }),
  applyRerun: (actionId, correctedOutput, strategy) =>
    set((state) => {
      const target = state.actions.find((action) => action.id === actionId);
      if (!target) {
        return state;
      }
      const remaining = state.processingActionIds.filter((id) => id !== actionId);
      const correctedAction: AgentAction = {
        ...target,
        id: strategy === 'append' ? `${target.id}-corr-${Date.now()}` : target.id,
        correctedOutput,
        humanCorrected: true,
        status: 'done',
      };
      if (strategy === 'append') {
        return {
          processingActionIds: remaining,
          feedbackMessage: 'Re-run complete. Corrected action added.',
          feedbackTone: 'success',
          actions: [correctedAction, ...state.actions],
        };
      }
      return {
        processingActionIds: remaining,
        feedbackMessage: 'Re-run complete. Action updated.',
        feedbackTone: 'success',
        actions: state.actions.map((action) => (action.id === actionId ? correctedAction : action)),
      };
    }),
  markRetry: (actionId, status) =>
    set((state) => ({
      feedbackMessage: status === 'done' ? 'Retry succeeded.' : 'Retry failed. Review and try fallback.',
      feedbackTone: status === 'done' ? 'success' : 'warning',
      actions: state.actions.map((action) =>
        action.id === actionId
          ? {
              ...action,
              status,
              retryCount: action.retryCount + 1,
              errorReason: status === 'done' ? undefined : action.errorReason,
            }
          : action,
      ),
    })),
  markFallback: (actionId, fallbackOption) =>
    set((state) => ({
      feedbackMessage: `Fallback applied: ${fallbackOption}`,
      feedbackTone: 'info',
      actions: state.actions.map((action) =>
        action.id === actionId
          ? {
              ...action,
              fallbackOption,
              status: 'done',
            }
          : action,
      ),
    })),
    approveAction: (actionId) =>
      set((state) => ({
        feedbackMessage: 'Action approved.',
        feedbackTone: 'success',
        actions: state.actions.map((action) =>
          action.id === actionId
            ? {
                ...action,
                approvalStatus: 'approved',
                status: 'done',
                errorReason: undefined,
              }
            : action,
        ),
      })),
    rejectAction: (actionId) =>
      set((state) => ({
        feedbackMessage: 'Action rejected.',
        feedbackTone: 'warning',
        actions: state.actions.map((action) =>
          action.id === actionId
            ? {
                ...action,
                approvalStatus: 'rejected',
                status: 'failed',
                errorReason: 'Action rejected by operator',
              }
            : action,
        ),
      })),
  setAgentTab: (tab) => set({ selectedAgentTab: tab }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  showFeedback: (message, tone = 'info') => set({ feedbackMessage: message, feedbackTone: tone }),
  clearFeedback: () => set({ feedbackMessage: null }),
  startProcessingAction: (actionId) =>
    set((state) => ({
      processingActionIds: state.processingActionIds.includes(actionId)
        ? state.processingActionIds
        : [...state.processingActionIds, actionId],
    })),
  stopProcessingAction: (actionId) =>
    set((state) => ({
      processingActionIds: state.processingActionIds.filter((id) => id !== actionId),
    })),
  theme: (typeof window !== 'undefined' && (window.localStorage.getItem('theme') as 'light' | 'dark')) || 'dark',
  userName: (typeof window !== 'undefined' && window.localStorage.getItem('userName')) || 'Alex Chen',
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem('theme', next);
      } catch {
        /* ignore */
      }
      return { theme: next };
    }),
  isAuthenticated:
    typeof window !== 'undefined' ? window.localStorage.getItem('isAuthenticated') === 'true' : false,
  login: (userName) =>
    set(() => {
      const nextName = userName.trim() || 'Agent Operator';
      try {
        window.localStorage.setItem('userName', nextName);
        window.localStorage.setItem('isAuthenticated', 'true');
      } catch {
        /* ignore */
      }
      return {
        isAuthenticated: true,
        userName: nextName,
      };
    }),
  logout: () =>
    set(() => {
      try {
        window.localStorage.removeItem('isAuthenticated');
        window.localStorage.removeItem('userName');
      } catch {
        /* ignore */
      }
      return {
        isAuthenticated: false,
        userName: 'Alex Chen',
      };
    }),
}));
