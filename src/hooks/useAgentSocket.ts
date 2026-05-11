import { useEffect, useMemo, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAgentStore } from '../store/agentStore';
import type { Agent, AgentAction, AgentRule } from '../types/agent.types';
import { getMockSocket, type MockSocket } from '../services/mockSocket';

interface PauseResponse {
  agentId: string;
  status: Agent['status'];
  success: boolean;
}

interface DashboardSocketLike {
  connected: boolean;
  connect: () => void;
  disconnect: () => void;
  removeAllListeners: () => void;
  on: <TArgs extends unknown[]>(eventName: string, listener: (...args: TArgs) => void) => void;
  io?: {
    on: <TArgs extends unknown[]>(eventName: string, listener: (...args: TArgs) => void) => void;
    off: (eventName: string) => void;
  };
}

/**
 * Connects to the backend socket and wires all dashboard events into Zustand state.
 * Falls back to mock socket if backend is unavailable (e.g., on Vercel).
 * Only initializes when user is authenticated.
 */
export function useAgentSocket(): Socket | MockSocket {
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
  const [useMockSocket, setUseMockSocket] = useState(
    () => import.meta.env.PROD || import.meta.env.VITE_USE_REAL_SOCKET !== 'true',
  );

  const socket = useMemo(() => {
    if (!useMockSocket) {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
      const realSocket = io(backendUrl, {
        transports: ['websocket'],
        autoConnect: false,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });
      return realSocket;
    }

    return getMockSocket();
  }, [useMockSocket]);

  useEffect(() => {
    if (!isAuthenticated) {
      if (socket?.connected) {
        socket.disconnect();
      }
      return;
    }

    const activeSocket = socket as DashboardSocketLike;

    if (!activeSocket.connected) {
      activeSocket.connect();
    }

    activeSocket.on('connect', () => {
      setConnectionStatus('connected');
    });

    activeSocket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    const socketIo = activeSocket.io;

    if (socketIo) {
      socketIo.on('reconnect_attempt', () => {
        setConnectionStatus('reconnecting');
      });

      socketIo.on('reconnect_failed', () => {
        setUseMockSocket(true);
        activeSocket.disconnect();
        setConnectionStatus('disconnected');
        showFeedback('Backend unavailable. Using demo mode.', 'warning');
      });
    }

    activeSocket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
      if (!useMockSocket) {
        setUseMockSocket(true);
        activeSocket.disconnect();
        setConnectionStatus('disconnected');
        showFeedback('Backend unavailable. Switching to demo mode.', 'warning');
      }
    });

    activeSocket.on('agents:init', (agents: Agent[]) => {
      setAgents(agents);
    });

    activeSocket.on('actions:init', (actions: AgentAction[]) => {
      setActions(actions);
    });

    activeSocket.on('agent:status', (payload: PauseResponse) => {
      if (payload.success) {
        confirmPause(payload.agentId, payload.status);
      } else {
        rollbackPause(payload.agentId);
      }
    });

    activeSocket.on('agent:update', (agent: Agent) => {
      upsertAgent(agent);
    });

    activeSocket.on('agent:action', (action: AgentAction) => {
      addAction(action);
    });

    activeSocket.on('agent:action:updated', (action: AgentAction) => {
      upsertAction(action);
    });

    activeSocket.on('agent:redirect:ack', () => {
      showFeedback('Redirect sent and acknowledged by the agent.', 'success');
    });

    activeSocket.on('agent:approved', (payload: { actionId: string }) => {
      approveAction(payload.actionId);
    });

    activeSocket.on('agent:rejected', (payload: { actionId: string }) => {
      rejectAction(payload.actionId);
    });

    activeSocket.on('rules:update', (rules: AgentRule[]) => {
      setRules(rules);
    });

    activeSocket.on(
      'agent:rerun:result',
      (payload: { actionId: string; correctedOutput: string; append: boolean }) => {
        applyRerun(payload.actionId, payload.correctedOutput, payload.append ? 'append' : 'replace');
      },
    );

    activeSocket.on('agent:retry:result', (payload: { actionId: string; status: AgentAction['status'] }) => {
      markRetry(payload.actionId, payload.status);
    });

    activeSocket.on('agent:fallback:result', (payload: { actionId: string; fallbackOption: string }) => {
      markFallback(payload.actionId, payload.fallbackOption);
    });

    return () => {
      activeSocket.removeAllListeners();
      if (socketIo) {
        socketIo.off('reconnect_attempt');
        socketIo.off('reconnect_failed');
      }
    };
  }, [
    socket,
    isAuthenticated,
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
    useMockSocket,
  ]);

  return socket;
}
