import { useEffect, useMemo } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAgentStore } from '../store/agentStore';
import type { Agent, AgentAction, AgentRule } from '../types/agent.types';

interface PauseResponse {
  agentId: string;
  status: Agent['status'];
  success: boolean;
}

/**
 * Connects to the backend socket and wires all dashboard events into Zustand state.
 * Only initializes when user is authenticated.
 */
export function useAgentSocket(): Socket {
  const setAgents = useAgentStore((state) => state.setAgents);
  const setActions = useAgentStore((state) => state.setActions);
  const addAction = useAgentStore((state) => state.addAction);
  const upsertAgent = useAgentStore((state) => state.upsertAgent);
  const confirmPause = useAgentStore((state) => state.confirmPause);
  const rollbackPause = useAgentStore((state) => state.rollbackPause);
  const setRules = useAgentStore((state) => state.setRules);
  const upsertAction = useAgentStore((state) => state.upsertAction);
  const applyRerun = useAgentStore((state) => state.applyRerun);
  const markRetry = useAgentStore((state) => state.markRetry);
  const markFallback = useAgentStore((state) => state.markFallback);
  const approveAction = useAgentStore((state) => state.approveAction);
  const rejectAction = useAgentStore((state) => state.rejectAction);
  const setConnectionStatus = useAgentStore((state) => state.setConnectionStatus);
  const showFeedback = useAgentStore((state) => state.showFeedback);
  const isAuthenticated = useAgentStore((state) => state.isAuthenticated);
  const userName = useAgentStore((state) => state.userName);

  const socket = useMemo(
    () =>
      io('http://localhost:4000', {
        transports: ['websocket'],
        autoConnect: false, // Changed: don't auto-connect, we control when
      }),
    [],
  );

  useEffect(() => {
    // Only initialize socket when user is authenticated
    if (!isAuthenticated) {
      if (socket.connected) {
        socket.disconnect();
      }
      return;
    }

    // Connect when authenticated
    if (!socket.connected) {
      socket.connect();
    }

    socket.on('connect', () => {
      console.log(`[Socket] Connected as ${userName}`);
      setConnectionStatus('connected');
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${reason}`);
      setConnectionStatus('disconnected');
    });

    socket.io.on('reconnect_attempt', () => {
      console.log('[Socket] Attempting to reconnect...');
      setConnectionStatus('reconnecting');
    });

    socket.io.on('reconnect_failed', () => {
      console.log('[Socket] Reconnect failed');
      setConnectionStatus('disconnected');
      showFeedback('Connection lost. Attempting to recover.', 'error');
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
      setConnectionStatus('disconnected');
    });

    socket.on('agents:init', (agents: Agent[]) => {
      console.log(`[Socket] Received ${agents.length} agents`);
      setAgents(agents);
    });

    socket.on('actions:init', (actions: AgentAction[]) => {
      console.log(`[Socket] Received ${actions.length} initial actions`);
      setActions(actions);
    });

    socket.on('agent:status', (payload: PauseResponse) => {
      console.log(`[Socket] Agent status updated:`, payload);
      if (payload.success) {
        confirmPause(payload.agentId, payload.status);
      } else {
        rollbackPause(payload.agentId);
      }
    });

    socket.on('agent:update', (agent: Agent) => {
      console.log(`[Socket] Agent updated: ${agent.name} → ${agent.status}`);
      upsertAgent(agent);
    });

    socket.on('agent:action', (action: AgentAction) => {
      console.log(`[Socket] New action: ${action.actionType} from ${action.agentId}`);
      addAction(action);
    });

    socket.on('agent:action:updated', (action: AgentAction) => {
      console.log(`[Socket] Action updated: ${action.id}`);
      upsertAction(action);
    });

    socket.on('agent:redirect:ack', (payload: { agentId: string; acknowledgedAt: string }) => {
      console.log(`[Socket] Redirect acknowledged for ${payload.agentId}`);
      showFeedback('Redirect sent and acknowledged by the agent.', 'success');
    });

    socket.on('agent:approved', (payload: { actionId: string }) => {
      console.log(`[Socket] Action approved: ${payload.actionId}`);
      approveAction(payload.actionId);
    });

    socket.on('agent:rejected', (payload: { actionId: string }) => {
      console.log(`[Socket] Action rejected: ${payload.actionId}`);
      rejectAction(payload.actionId);
    });

    socket.on('rules:update', (rules: AgentRule[]) => {
      console.log(`[Socket] Rules updated: ${rules.length} rules`);
      setRules(rules);
    });

    socket.on(
      'agent:rerun:result',
      (payload: { actionId: string; correctedOutput: string; append: boolean }) => {
        console.log(`[Socket] Rerun result for action ${payload.actionId}`);
        applyRerun(payload.actionId, payload.correctedOutput, payload.append ? 'append' : 'replace');
      },
    );

    socket.on('agent:retry:result', (payload: { actionId: string; status: AgentAction['status'] }) => {
      console.log(`[Socket] Retry result for action ${payload.actionId}: ${payload.status}`);
      markRetry(payload.actionId, payload.status);
    });

    socket.on('agent:fallback:result', (payload: { actionId: string; fallbackOption: string }) => {
      console.log(`[Socket] Fallback applied to ${payload.actionId}: ${payload.fallbackOption}`);
      markFallback(payload.actionId, payload.fallbackOption);
    });

    return () => {
      console.log('[Socket] Cleaning up listeners');
      socket.removeAllListeners();
      socket.io.off('reconnect_attempt');
      socket.io.off('reconnect_failed');
    };
  }, [
    socket,
    isAuthenticated,
    userName,
    addAction,
    applyRerun,
    confirmPause,
    markFallback,
    approveAction,
    rejectAction,
    markRetry,
    rollbackPause,
    setAgents,
    setConnectionStatus,
    setRules,
    setActions,
    upsertAction,
    showFeedback,
    upsertAgent,
  ]);

  return socket;
}
