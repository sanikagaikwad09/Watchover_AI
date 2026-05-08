import { useEffect, useMemo, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAgentStore } from '../store/agentStore';
import type { Agent, AgentAction, AgentRule } from '../types/agent.types';
import { getMockSocket, type MockSocket } from '../services/mockSocket';

interface PauseResponse {
  agentId: string;
  status: Agent['status'];
  success: boolean;
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
  const userName = useAgentStore((state) => state.userName);

  const useMockRef = useRef(false);

  const socket = useMemo(() => {
    // Check if we should use mock mode based on environment
    const isProduction = import.meta.env.PROD;

    // If we're not in production and there's a backend, try the real socket
    if (!isProduction) {
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

    // In production, default to mock mode
    useMockRef.current = true;
    return null as any; // Will be replaced in useEffect
  }, []);

  useEffect(() => {
    // Only initialize socket when user is authenticated
    if (!isAuthenticated) {
      if (socket?.connected) {
        socket.disconnect();
      }
      const mockSocket = getMockSocket();
      if (mockSocket.connected) {
        mockSocket.disconnect();
      }
      return;
    }

    // Determine which socket to use
    let activeSocket: Socket | MockSocket;

    // If socket is null (production mode) or useMockRef is set, use mock socket
    if (socket === null || useMockRef.current || import.meta.env.PROD) {
      console.log('[Socket] Using demo mode with mock data');
      activeSocket = getMockSocket();
    } else {
      activeSocket = socket;
    }

    // Connect when authenticated
    if (!activeSocket.connected) {
      activeSocket.connect();
    }

    activeSocket.on('connect', () => {
      console.log(`[Socket] Connected as ${userName}`);
      setConnectionStatus('connected');
    });

    activeSocket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${reason}`);
      setConnectionStatus('disconnected');
    });

    // Handle reconnection events only for real Socket.io sockets
    if (socket !== null && 'io' in activeSocket) {
      activeSocket.io.on('reconnect_attempt', () => {
        console.log('[Socket] Attempting to reconnect...');
        setConnectionStatus('reconnecting');
      });

      activeSocket.io.on('reconnect_failed', () => {
        console.log('[Socket] Reconnect failed, switching to demo mode');
        useMockRef.current = true;
        if (socket) socket.disconnect();
        setConnectionStatus('disconnected');
        showFeedback('Backend unavailable. Using demo mode.', 'warning');
      });
    }

    activeSocket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
      if (!useMockRef.current) {
        useMockRef.current = true;
        if (socket) socket.disconnect();
        setConnectionStatus('disconnected');
        showFeedback('Backend unavailable. Switching to demo mode.', 'warning');
      }
    });

    activeSocket.on('agents:init', (agents: Agent[]) => {
      console.log(`[Socket] Received ${agents.length} agents`);
      setAgents(agents);
    });

    activeSocket.on('actions:init', (actions: AgentAction[]) => {
      console.log(`[Socket] Received ${actions.length} initial actions`);
      setActions(actions);
    });

    activeSocket.on('agent:status', (payload: PauseResponse) => {
      console.log(`[Socket] Agent status updated:`, payload);
      if (payload.success) {
        confirmPause(payload.agentId, payload.status);
      } else {
        rollbackPause(payload.agentId);
      }
    });

    activeSocket.on('agent:update', (agent: Agent) => {
      console.log(`[Socket] Agent updated: ${agent.name} → ${agent.status}`);
      upsertAgent(agent);
    });

    activeSocket.on('agent:action', (action: AgentAction) => {
      console.log(`[Socket] New action: ${action.actionType} from ${action.agentId}`);
      addAction(action);
    });

    activeSocket.on('agent:action:updated', (action: AgentAction) => {
      console.log(`[Socket] Action updated: ${action.id}`);
      upsertAction(action);
    });

    activeSocket.on('agent:redirect:ack', (payload: { agentId: string; acknowledgedAt: string }) => {
      console.log(`[Socket] Redirect acknowledged for ${payload.agentId}`);
      showFeedback('Redirect sent and acknowledged by the agent.', 'success');
    });

    activeSocket.on('agent:approved', (payload: { actionId: string }) => {
      console.log(`[Socket] Action approved: ${payload.actionId}`);
      approveAction(payload.actionId);
    });

    activeSocket.on('agent:rejected', (payload: { actionId: string }) => {
      console.log(`[Socket] Action rejected: ${payload.actionId}`);
      rejectAction(payload.actionId);
    });

    activeSocket.on('rules:update', (rules: AgentRule[]) => {
      console.log(`[Socket] Rules updated: ${rules.length} rules`);
      setRules(rules);
    });

    activeSocket.on(
      'agent:rerun:result',
      (payload: { actionId: string; correctedOutput: string; append: boolean }) => {
        console.log(`[Socket] Rerun result for action ${payload.actionId}`);
        applyRerun(payload.actionId, payload.correctedOutput, payload.append ? 'append' : 'replace');
      },
    );

    activeSocket.on('agent:retry:result', (payload: { actionId: string; status: AgentAction['status'] }) => {
      console.log(`[Socket] Retry result for action ${payload.actionId}: ${payload.status}`);
      markRetry(payload.actionId, payload.status);
    });

    activeSocket.on('agent:fallback:result', (payload: { actionId: string; fallbackOption: string }) => {
      console.log(`[Socket] Fallback applied to ${payload.actionId}: ${payload.fallbackOption}`);
      markFallback(payload.actionId, payload.fallbackOption);
    });

    return () => {
      console.log('[Socket] Cleaning up listeners');
      activeSocket.removeAllListeners();
      if (socket !== null && 'io' in activeSocket) {
        activeSocket.io.off('reconnect_attempt');
        activeSocket.io.off('reconnect_failed');
      }
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

  // Return the appropriate socket
  if (socket === null || useMockRef.current || import.meta.env.PROD) {
    return getMockSocket();
  }

  return socket;
}
