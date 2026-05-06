import type { Agent, AgentAction, AgentRule, DecisionTraceStep } from '../types/agent.types.js';

const actionTypes = ['email.send', 'calendar.create', 'web.search', 'file.read', 'api.call'] as const;

const descriptions = [
  "Drafting reply to John's Q3 meeting request",
  'Preparing follow-up email to product stakeholders',
  'Checking scheduling conflicts for next Tuesday',
  'Scanning policy docs for reimbursement rules',
  'Gathering competitor pricing from recent sources',
  'Calling CRM API to sync lead ownership updates',
];

const reasoningSnippets = [
  'Prioritized based on user urgency and latest inbox thread context.',
  'Selected the option with lowest conflict risk and highest completion chance.',
  'Applied previous interaction pattern to keep communication concise.',
  'Fallback branch selected due to partial data in external API response.',
  'Used confidence threshold policy before sending externally visible content.',
];

const outputs = [
  'Hi John, I can do 10:30 AM or 2:00 PM tomorrow. Let me know what works best.',
  'Created calendar event with prep notes and invited participants.',
  'Top 5 sources summarized with key pricing deltas by competitor.',
  'Read file and extracted action items into checklist format.',
  'API call completed with 200 response and synced 14 records.',
];

const mockAgents: Agent[] = [
  {
    id: 'agent-email',
    name: 'Email Manager',
    status: 'running',
    trustScore: 87,
    lastAction: 'Monitoring inbox priorities',
    actionsCount: 0,
  },
  {
    id: 'agent-calendar',
    name: 'Calendar Assistant',
    status: 'running',
    trustScore: 82,
    lastAction: 'Watching schedule conflicts',
    actionsCount: 0,
  },
  {
    id: 'agent-research',
    name: 'Research Bot',
    status: 'running',
    trustScore: 78,
    lastAction: 'Scanning latest market updates',
    actionsCount: 0,
  },
];

const actions: AgentAction[] = [];
const rules: AgentRule[] = [];

function findAction(actionId: string): AgentAction | undefined {
  return actions.find((action) => action.id === actionId);
}

function randomIndex(max: number): number {
  return Math.floor(Math.random() * max);
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function buildDecisionTrace(description: string, actionType: string, output: string): DecisionTraceStep[] {
  return [
    {
      step: 'context_parsing',
      data: `Parsed latest task context from queue: ${description}`,
    },
    {
      step: 'intent_detection',
      data: `Detected core intent as ${actionType} with medium-to-high urgency.`,
    },
    {
      step: 'options_generated',
      data: [
        'Proceed automatically using default policy',
        'Ask for user confirmation before external action',
        'Defer and collect more context first',
      ],
    },
    {
      step: 'final_decision',
      data: output,
      reasoning: reasoningSnippets[randomIndex(reasoningSnippets.length)],
    },
  ];
}

function applyRules(agentId: string, action: AgentAction): AgentAction {
  const activeRules = rules.filter((rule) => rule.agentId === agentId && rule.enabled);
  const matched = activeRules.find((rule) => action.description.toLowerCase().includes(rule.condition.toLowerCase()));
  if (!matched) {
    return action;
  }

  return {
    ...action,
    output: `${action.output}\n\nRule applied: ${matched.instruction}`,
    reasoning: `${action.reasoning} Rule '${matched.condition}' influenced the output.`,
  };
}

function updateAction(actionId: string, mutator: (action: AgentAction) => AgentAction): AgentAction | null {
  const target = findAction(actionId);
  if (!target) {
    return null;
  }

  const next = mutator({ ...target });
  const index = actions.findIndex((action) => action.id === actionId);
  if (index !== -1) {
    actions[index] = next;
  }
  return { ...next };
}

export function getAgents(): Agent[] {
  return [...mockAgents];
}

export function getActions(): AgentAction[] {
  return [...actions];
}

export function getRules(): AgentRule[] {
  return [...rules];
}

export function updateAgentStatus(agentId: string, status: Agent['status']): Agent | null {
  const agent = mockAgents.find((entry) => entry.id === agentId);
  if (!agent) {
    return null;
  }
  agent.status = status;
  return { ...agent };
}

export function createRule(agentId: string, condition: string, instruction: string): AgentRule {
  const rule: AgentRule = {
    id: `rule-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    agentId,
    condition,
    instruction,
    createdAt: new Date().toISOString(),
    enabled: true,
  };
  rules.unshift(rule);
  return rule;
}

export function toggleRule(ruleId: string): AgentRule | null {
  const target = rules.find((rule) => rule.id === ruleId);
  if (!target) {
    return null;
  }
  target.enabled = !target.enabled;
  return { ...target };
}

export function deleteRule(ruleId: string): boolean {
  const index = rules.findIndex((rule) => rule.id === ruleId);
  if (index === -1) {
    return false;
  }
  rules.splice(index, 1);
  return true;
}

export function generateAction(): AgentAction | null {
  const runningAgents = mockAgents.filter((agent) => agent.status === 'running');
  if (runningAgents.length === 0) {
    return null;
  }

  const agent = runningAgents[randomIndex(runningAgents.length)];
  const actionType = actionTypes[randomIndex(actionTypes.length)];
  const description = descriptions[randomIndex(descriptions.length)];
  const output = outputs[randomIndex(outputs.length)];
  const confidence = Number(randomBetween(0.55, 0.99).toFixed(2));
  const failure = Math.random() < 0.14;

  const baseAction: AgentAction = {
    id: `action-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    agentId: agent.id,
    timestamp: new Date().toISOString(),
    actionType,
    description,
    reasoning: reasoningSnippets[randomIndex(reasoningSnippets.length)],
    confidence,
    status: failure ? 'failed' : 'done',
    decisionTrace: buildDecisionTrace(description, actionType, output),
    output,
    retryCount: 0,
    errorReason: failure ? 'API gateway timeout during downstream execution' : undefined,
    fallbackOption: undefined,
    approvalStatus: confidence < 0.8 || failure ? 'pending' : 'approved',
  };

  const action = applyRules(agent.id, baseAction);
  agent.lastAction = action.description;
  agent.actionsCount += 1;
  agent.trustScore = Math.max(45, Math.min(99, agent.trustScore + randomBetween(-4, 2)));
  actions.unshift(action);

  return { ...action };
}

export function rerunAction(actionId: string, correctedOutput: string, append: boolean): AgentAction | null {
  if (append) {
    const target = findAction(actionId);
    if (!target) {
      return null;
    }
    const corrected: AgentAction = {
      ...target,
      id: `${target.id}-corr-${Date.now()}`,
      timestamp: new Date().toISOString(),
      correctedOutput,
      humanCorrected: true,
      status: 'done',
      approvalStatus: 'approved',
      errorReason: undefined,
    };
    actions.unshift(corrected);
    return corrected;
  }

  return updateAction(actionId, (target) => ({
    ...target,
    correctedOutput,
    humanCorrected: true,
    status: 'done',
    approvalStatus: 'approved',
    errorReason: undefined,
  }));
}

export function retryAction(actionId: string, correctedOutput?: string): AgentAction | null {
  return updateAction(actionId, (target) => {
    target.retryCount += 1;
    const success = Math.random() > 0.35 || Boolean(correctedOutput);
    target.status = success ? 'done' : 'failed';
    target.approvalStatus = success ? 'approved' : 'pending';
    target.errorReason = success ? undefined : 'Retry failed due to transient dependency failure';
    if (correctedOutput) {
      target.correctedOutput = correctedOutput;
      target.humanCorrected = true;
    }
    return target;
  });
}

export function setFallback(actionId: string, fallbackOption: string): AgentAction | null {
  return updateAction(actionId, (target) => ({
    ...target,
    status: 'done',
    approvalStatus: 'approved',
    fallbackOption,
    errorReason: undefined,
  }));
}

export function approveAction(actionId: string): AgentAction | null {
  return updateAction(actionId, (target) => ({
    ...target,
    approvalStatus: 'approved',
    status: 'done',
    errorReason: undefined,
  }));
}

export function rejectAction(actionId: string): AgentAction | null {
  return updateAction(actionId, (target) => ({
    ...target,
    approvalStatus: 'rejected',
    status: 'failed',
    errorReason: 'Action rejected by operator',
  }));
}
