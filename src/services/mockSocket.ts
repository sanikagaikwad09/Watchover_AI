import type { Agent, AgentAction, AgentRule } from '../types/agent.types';
import { MOCK_AGENTS, MOCK_ACTIONS, MOCK_RULES, generateMockAction } from './mockData';

/**
 * Simple event emitter implementation for browser compatibility
 */
class SimpleEventEmitter {
  private listeners: Map<string, Array<(...args: any[]) => void>> = new Map();

  on(eventName: string, listener: (...args: any[]) => void) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)!.push(listener);
    return this;
  }

  off(eventName: string, listener: (...args: any[]) => void) {
    if (!this.listeners.has(eventName)) return this;
    const listeners = this.listeners.get(eventName)!;
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
    return this;
  }

  once(eventName: string, listener: (...args: any[]) => void) {
    const onceWrapper = (...args: any[]) => {
      listener(...args);
      this.off(eventName, onceWrapper);
    };
    return this.on(eventName, onceWrapper);
  }

  removeAllListeners(eventName?: string | symbol) {
    if (eventName === undefined) {
      this.listeners.clear();
    } else {
      this.listeners.delete(String(eventName));
    }
    return this;
  }

  protected emitBase(eventName: string, ...args: any[]) {
    if (!this.listeners.has(eventName)) return false;
    const listeners = this.listeners.get(eventName)!;
    listeners.forEach((listener) => listener(...args));
    return listeners.length > 0;
  }
}

/**
 * Mock Socket.io implementation for demo mode.
 * Simulates the backend server without requiring an actual connection.
 * Generates random actions to simulate live agent activity.
 */
export class MockSocket extends SimpleEventEmitter {
  connected = false;
  private actionInterval: NodeJS.Timeout | null = null;
  private agents: Agent[] = [...MOCK_AGENTS];
  private actions: AgentAction[] = [...MOCK_ACTIONS];
  private rules: AgentRule[] = [...MOCK_RULES];

  connect() {
    this.connected = true;
    // Simulate connection delay
    setTimeout(() => {
      this.emitBase('connect');
      this.sendInitialData();
      this.startSimulatingActions();
    }, 500);
  }

  disconnect() {
    this.connected = false;
    if (this.actionInterval) {
      clearInterval(this.actionInterval);
      this.actionInterval = null;
    }
    this.emitBase('disconnect', 'mock-disconnect');
  }

  private sendInitialData() {
    // Send initial agents
    this.emitBase('agents:init', this.agents);

    // Send initial actions
    this.emitBase('actions:init', this.actions);

    // Send initial rules
    this.emitBase('rules:update', this.rules);
  }

  private startSimulatingActions() {
    // Generate a new action every 4-8 seconds
    this.actionInterval = setInterval(() => {
      const newAction = generateMockAction();
      this.actions.unshift(newAction);

      // Update agent with new action
      const agent = this.agents.find((a) => a.id === newAction.agentId);
      if (agent) {
        agent.lastAction = newAction.description;
        agent.actionsCount++;
        // Simulate trust score changes
        agent.trustScore = Math.max(0.7, Math.min(1, agent.trustScore + (Math.random() - 0.5) * 0.05));

        this.emitBase('agent:update', { ...agent });
      }

      // Emit the new action
      this.emitBase('agent:action', newAction);
    }, 4000 + Math.random() * 4000);
  }

  // Override emit to handle client -> server events
  emit(eventName: string, ...args: any[]) {
    // Handle client-side emits (requests to server)
    if (eventName === 'agent:pause') {
      const payload = args[0] as { agentId: string };
      this.handleAgentPause(payload.agentId);
      return true;
    }

    if (eventName === 'agent:resume') {
      const payload = args[0] as { agentId: string };
      this.handleAgentResume(payload.agentId);
      return true;
    }

    if (eventName === 'agent:redirect') {
      const payload = args[0] as { agentId: string; newInstruction: string };
      this.handleAgentRedirect(payload.agentId);
      return true;
    }

    if (eventName === 'agent:approve') {
      const payload = args[0] as { actionId: string };
      this.handleActionApprove(payload.actionId);
      return true;
    }

    if (eventName === 'agent:reject') {
      const payload = args[0] as { actionId: string };
      this.handleActionReject(payload.actionId);
      return true;
    }

    if (eventName === 'agent:rerun') {
      const payload = args[0] as { actionId: string; correctedOutput: string; append: boolean };
      this.handleActionRerun(payload.actionId, payload.correctedOutput, payload.append);
      return true;
    }

    if (eventName === 'agent:retry') {
      const payload = args[0] as { actionId: string; correctedOutput?: string };
      this.handleActionRetry(payload.actionId);
      return true;
    }

    if (eventName === 'agent:fallback') {
      const payload = args[0] as { actionId: string; fallbackOption: string };
      this.handleActionFallback(payload.actionId, payload.fallbackOption);
      return true;
    }

    if (eventName === 'rule:create') {
      const payload = args[0] as { agentId: string; condition: string; instruction: string };
      this.handleRuleCreate(payload.agentId, payload.condition, payload.instruction);
      return true;
    }

    if (eventName === 'rule:toggle') {
      const payload = args[0] as { id: string };
      this.handleRuleToggle(payload.id);
      return true;
    }

    if (eventName === 'rule:delete') {
      const payload = args[0] as { id: string };
      this.handleRuleDelete(payload.id);
      return true;
    }

    // For all other events, pass through to parent
    return this.emitBase(eventName, ...args);
  }

  private handleAgentPause(agentId: string) {
    const agent = this.agents.find((a) => a.id === agentId);
    if (agent) {
      agent.status = 'paused';
      // Emit server response
      setTimeout(() => {
        this.emitBase('agent:status', {
          agentId,
          status: 'paused' as const,
          success: true,
        });
      }, 300);
    }
  }

  private handleAgentResume(agentId: string) {
    const agent = this.agents.find((a) => a.id === agentId);
    if (agent) {
      agent.status = 'running';
      // Emit server response
      setTimeout(() => {
        this.emitBase('agent:status', {
          agentId,
          status: 'running' as const,
          success: true,
        });
      }, 300);
    }
  }

  private handleAgentRedirect(agentId: string) {
    // Simulate redirect acknowledgment
    setTimeout(() => {
      this.emitBase('agent:redirect:ack', {
        agentId,
        acknowledgedAt: new Date().toISOString(),
      });
    }, 300);
  }

  private handleActionApprove(actionId: string) {
    const action = this.actions.find((a) => a.id === actionId);
    if (action) {
      action.approvalStatus = 'approved';
      // Emit server response
      setTimeout(() => {
        this.emitBase('agent:approved', { actionId });
      }, 300);
    }
  }

  private handleActionReject(actionId: string) {
    const action = this.actions.find((a) => a.id === actionId);
    if (action) {
      action.approvalStatus = 'rejected';
      // Emit server response
      setTimeout(() => {
        this.emitBase('agent:rejected', { actionId });
      }, 300);
    }
  }

  private handleActionRerun(actionId: string, correctedOutput: string, append: boolean) {
    const action = this.actions.find((a) => a.id === actionId);
    if (action) {
      action.output = append ? `${action.output}\n${correctedOutput}` : correctedOutput;
      action.correctedOutput = correctedOutput;
      action.humanCorrected = true;
      // Emit server response
      setTimeout(() => {
        this.emitBase('agent:rerun:result', {
          actionId,
          correctedOutput,
          append,
        });
      }, 300);
    }
  }

  private handleActionRetry(actionId: string) {
    const action = this.actions.find((a) => a.id === actionId);
    if (action) {
      action.retryCount++;
      action.status = 'done';
      // Emit server response
      setTimeout(() => {
        this.emitBase('agent:retry:result', {
          actionId,
          status: 'done' as const,
        });
      }, 300);
    }
  }

  private handleActionFallback(actionId: string, fallbackOption: string) {
    const action = this.actions.find((a) => a.id === actionId);
    if (action) {
      action.fallbackOption = fallbackOption;
      action.status = 'interrupted';
      // Emit server response
      setTimeout(() => {
        this.emitBase('agent:fallback:result', {
          actionId,
          fallbackOption,
        });
      }, 300);
    }
  }

  private handleRuleCreate(agentId: string, condition: string, instruction: string) {
    const newRule: AgentRule = {
      id: `rule-${Date.now()}`,
      agentId,
      condition,
      instruction,
      createdAt: new Date().toISOString(),
      enabled: true,
    };
    this.rules.push(newRule);
    // Emit server response
    setTimeout(() => {
      this.emitBase('rules:update', this.rules);
    }, 300);
  }

  private handleRuleToggle(ruleId: string) {
    const rule = this.rules.find((r) => r.id === ruleId);
    if (rule) {
      rule.enabled = !rule.enabled;
      // Emit server response
      setTimeout(() => {
        this.emitBase('rules:update', this.rules);
      }, 300);
    }
  }

  private handleRuleDelete(ruleId: string) {
    this.rules = this.rules.filter((r) => r.id !== ruleId);
    // Emit server response
    setTimeout(() => {
      this.emitBase('rules:update', this.rules);
    }, 300);
  }
}

/**
 * Create a singleton mock socket instance
 */
let mockSocketInstance: MockSocket | null = null;

export function createMockSocket(): MockSocket {
  if (!mockSocketInstance) {
    mockSocketInstance = new MockSocket();
  }
  return mockSocketInstance;
}

export function getMockSocket(): MockSocket {
  if (!mockSocketInstance) {
    mockSocketInstance = createMockSocket();
  }
  return mockSocketInstance;
}
