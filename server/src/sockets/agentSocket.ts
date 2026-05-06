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
      console.log(`[Simulation] Generated action: ${action.actionType} for agent ${action.agentId}`);
      io.emit('agent:action', action);
      const agent = getAgents().find((entry) => entry.id === action.agentId);
      if (agent) {
        console.log(`[Simulation] Emitting agent update: ${agent.name} → ${agent.status}`);
        io.emit('agent:update', agent);
      }
    }
  }, 3000);
}

export function registerAgentSocket(io: Server): void {
  console.log('[Socket] Setting up agent socket handlers');
  scheduleSimulation(io);

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);
    
    // Send initial state
    const initialAgents = getAgents();
    const initialActions = getActions();
    const initialRules = getRules();
    
    console.log(`[Socket] Sending initial state to ${socket.id}: ${initialAgents.length} agents, ${initialActions.length} actions, ${initialRules.length} rules`);
    socket.emit('agents:init', initialAgents);
    socket.emit('actions:init', initialActions);
    socket.emit('rules:update', initialRules);

    socket.on('agent:pause', (payload: { agentId: string }) => {
      console.log(`[Event] agent:pause from ${socket.id} for agent ${payload.agentId}`);
      const agent = updateAgentStatus(payload.agentId, 'paused');
      const response = {
        agentId: payload.agentId,
        status: agent?.status ?? 'error',
        success: Boolean(agent),
      };
      console.log(`[Event] Responding to pause with:`, response);
      io.emit('agent:status', response);
      if (agent) {
        io.emit('agent:update', agent);
      }
    });

    socket.on('agent:resume', (payload: { agentId: string }) => {
      console.log(`[Event] agent:resume from ${socket.id} for agent ${payload.agentId}`);
      const agent = updateAgentStatus(payload.agentId, 'running');
      const response = {
        agentId: payload.agentId,
        status: agent?.status ?? 'error',
        success: Boolean(agent),
      };
      console.log(`[Event] Responding to resume with:`, response);
      io.emit('agent:status', response);
      if (agent) {
        io.emit('agent:update', agent);
      }
    });

    socket.on('agent:approve', (payload: { actionId: string }) => {
      console.log(`[Event] agent:approve from ${socket.id} for action ${payload.actionId}`);
      const action = approveAction(payload.actionId);
      if (!action) {
        console.log('[Event] Approve failed - action not found');
        return;
      }
      io.emit('agent:action:updated', action);
    });

    socket.on('agent:reject', (payload: { actionId: string }) => {
      console.log(`[Event] agent:reject from ${socket.id} for action ${payload.actionId}`);
      const action = rejectAction(payload.actionId);
      if (!action) {
        console.log('[Event] Reject failed - action not found');
        return;
      }
      io.emit('agent:action:updated', action);
    });

    socket.on('agent:redirect', (payload: { agentId: string; newInstruction: string }) => {
      console.log(`[Event] agent:redirect from ${socket.id}`);
      console.log(`  → Agent: ${payload.agentId}`);
      console.log(`  → Instruction: ${payload.newInstruction}`);
      
      const ackPayload = {
        agentId: payload.agentId,
        newInstruction: payload.newInstruction,
        acknowledgedAt: new Date().toISOString(),
      };
      console.log(`[Event] Sending redirect acknowledgment`);
      io.emit('agent:redirect:ack', ackPayload);
    });

    socket.on('agent:rerun', (payload: { actionId: string; correctedOutput: string; append: boolean }) => {
      console.log(`[Event] agent:rerun from ${socket.id}: action ${payload.actionId}, append=${payload.append}`);
      const result = rerunAction(payload.actionId, payload.correctedOutput, payload.append);
      if (!result) {
        console.log(`[Event] Rerun failed - action not found`);
        return;
      }
      console.log(`[Event] Rerun succeeded, emitting result`);
      io.emit('agent:rerun:result', payload);
      if (payload.append) {
        io.emit('agent:action', result);
      } else {
        io.emit('agent:action:updated', result);
      }
    });

    socket.on('agent:retry', (payload: { actionId: string; correctedOutput?: string }) => {
      console.log(`[Event] agent:retry from ${socket.id}: action ${payload.actionId}`);
      const result = retryAction(payload.actionId, payload.correctedOutput);
      if (!result) {
        console.log(`[Event] Retry failed - action not found`);
        return;
      }
      console.log(`[Event] Retry succeeded with status: ${result.status}`);
      io.emit('agent:retry:result', { actionId: payload.actionId, status: result.status });
      io.emit('agent:action:updated', result);
    });

    socket.on('agent:fallback', (payload: { actionId: string; fallbackOption: string }) => {
      console.log(`[Event] agent:fallback from ${socket.id}: action ${payload.actionId}, option: ${payload.fallbackOption}`);
      const result = setFallback(payload.actionId, payload.fallbackOption);
      if (!result) {
        console.log(`[Event] Fallback failed - action not found`);
        return;
      }
      console.log(`[Event] Fallback applied successfully`);
      io.emit('agent:fallback:result', {
        actionId: payload.actionId,
        fallbackOption: payload.fallbackOption,
      });
      io.emit('agent:action:updated', result);
    });

    const handleCreateRule = (payload: { agentId: string; condition: string; instruction: string }) => {
      console.log(`[Event] rule:create from ${socket.id}: agent ${payload.agentId}`);
      console.log(`  → Condition: ${payload.condition}`);
      console.log(`  → Instruction: ${payload.instruction}`);
      createRule(payload.agentId, payload.condition, payload.instruction);
      const rules = getRules();
      io.emit('rules:update', rules);
    };

    socket.on('rule:create', handleCreateRule);
    socket.on('agent:addRule', handleCreateRule);

    const handleToggleRule = (payload: { id: string }) => {
      console.log(`[Event] rule:toggle from ${socket.id}: rule ${payload.id}`);
      toggleRule(payload.id);
      io.emit('rules:update', getRules());
    };

    socket.on('rule:toggle', handleToggleRule);
    socket.on('agent:toggleRule', handleToggleRule);

    const handleDeleteRule = (payload: { id: string }) => {
      console.log(`[Event] rule:delete from ${socket.id}: rule ${payload.id}`);
      deleteRule(payload.id);
      io.emit('rules:update', getRules());
    };

    socket.on('rule:delete', handleDeleteRule);
    socket.on('agent:deleteRule', handleDeleteRule);

    socket.on('error', (error) => {
      console.error(`[Socket] Error from ${socket.id}:`, error);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id} (reason: ${reason})`);
    });
  });
}
