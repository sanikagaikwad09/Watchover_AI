import type { Server } from 'socket.io';
import {
  approveAction,
  createRule,
  deleteRule,
  getActions,
  generateAction,
  getAgents,
  getRules,
  rerunAction,
  retryAction,
  setFallback,
  rejectAction,
  toggleRule,
  updateAgentStatus,
} from '../services/agentSimulator.js';

function scheduleSimulation(io: Server): void {
  setInterval(() => {
    const action = generateAction();
    if (action) {
      io.emit('agent:action', action);
      const agent = getAgents().find((entry) => entry.id === action.agentId);
      if (agent) {
        io.emit('agent:update', agent);
      }
    }
  }, 3000);
}

export function registerAgentSocket(io: Server): void {
  scheduleSimulation(io);

  io.on('connection', (socket) => {
    const initialAgents = getAgents();
    const initialActions = getActions();
    const initialRules = getRules();

    socket.emit('agents:init', initialAgents);
    socket.emit('actions:init', initialActions);
    socket.emit('rules:update', initialRules);

    socket.on('agent:pause', (payload: { agentId: string }) => {
      const agent = updateAgentStatus(payload.agentId, 'paused');
      const response = {
        agentId: payload.agentId,
        status: agent?.status ?? 'error',
        success: Boolean(agent),
      };
      io.emit('agent:status', response);
      if (agent) {
        io.emit('agent:update', agent);
      }
    });

    socket.on('agent:resume', (payload: { agentId: string }) => {
      const agent = updateAgentStatus(payload.agentId, 'running');
      const response = {
        agentId: payload.agentId,
        status: agent?.status ?? 'error',
        success: Boolean(agent),
      };
      io.emit('agent:status', response);
      if (agent) {
        io.emit('agent:update', agent);
      }
    });

    socket.on('agent:approve', (payload: { actionId: string }) => {
      const action = approveAction(payload.actionId);
      if (!action) {
        return;
      }
      io.emit('agent:action:updated', action);
    });

    socket.on('agent:reject', (payload: { actionId: string }) => {
      const action = rejectAction(payload.actionId);
      if (!action) {
        return;
      }
      io.emit('agent:action:updated', action);
    });

    socket.on('agent:redirect', (payload: { agentId: string; newInstruction: string }) => {
      io.emit('agent:redirect:ack', {
        agentId: payload.agentId,
        newInstruction: payload.newInstruction,
        acknowledgedAt: new Date().toISOString(),
      });
    });

    socket.on('agent:rerun', (payload: { actionId: string; correctedOutput: string; append: boolean }) => {
      const result = rerunAction(payload.actionId, payload.correctedOutput, payload.append);
      if (!result) {
        return;
      }
      io.emit('agent:rerun:result', payload);
      if (payload.append) {
        io.emit('agent:action', result);
      } else {
        io.emit('agent:action:updated', result);
      }
    });

    socket.on('agent:retry', (payload: { actionId: string; correctedOutput?: string }) => {
      const result = retryAction(payload.actionId, payload.correctedOutput);
      if (!result) {
        return;
      }
      io.emit('agent:retry:result', { actionId: payload.actionId, status: result.status });
      io.emit('agent:action:updated', result);
    });

    socket.on('agent:fallback', (payload: { actionId: string; fallbackOption: string }) => {
      const result = setFallback(payload.actionId, payload.fallbackOption);
      if (!result) {
        return;
      }
      io.emit('agent:fallback:result', {
        actionId: payload.actionId,
        fallbackOption: payload.fallbackOption,
      });
      io.emit('agent:action:updated', result);
    });

    const handleCreateRule = (payload: { agentId: string; condition: string; instruction: string }) => {
      createRule(payload.agentId, payload.condition, payload.instruction);
      io.emit('rules:update', getRules());
    };

    socket.on('rule:create', handleCreateRule);
    socket.on('agent:addRule', handleCreateRule);

    const handleToggleRule = (payload: { id: string }) => {
      toggleRule(payload.id);
      io.emit('rules:update', getRules());
    };

    socket.on('rule:toggle', handleToggleRule);
    socket.on('agent:toggleRule', handleToggleRule);

    const handleDeleteRule = (payload: { id: string }) => {
      deleteRule(payload.id);
      io.emit('rules:update', getRules());
    };

    socket.on('rule:delete', handleDeleteRule);
    socket.on('agent:deleteRule', handleDeleteRule);

    socket.on('error', (error) => {
      console.error(`[Socket] Error from ${socket.id}:`, error);
    });
  });
}
