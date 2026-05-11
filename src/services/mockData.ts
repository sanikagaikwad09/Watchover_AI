import type { Agent, AgentAction, AgentRule, IntegrationType } from '../types/agent.types';

const INTEGRATION_OPTIONS: IntegrationType[] = ['slack', 'gmail', 'notion', 'github'];

export const MOCK_AGENTS: Agent[] = [
  {
    id: 'agent-1',
    name: 'Email Manager',
    status: 'running',
    trustScore: 92,
    trustTrend: [88, 90, 91, 89, 92, 93, 92, 94],
    lastAction: 'Processed 3 emails, scheduled 2 follow-ups',
    actionsCount: 24,
  },
  {
    id: 'agent-2',
    name: 'Calendar Assistant',
    status: 'running',
    trustScore: 87,
    trustTrend: [83, 84, 86, 85, 87, 88, 87, 87],
    lastAction: 'Optimized meeting schedule, freed 2 hours',
    actionsCount: 18,
  },
  {
    id: 'agent-3',
    name: 'Research Bot',
    status: 'idle',
    trustScore: 95,
    trustTrend: [91, 92, 93, 94, 95, 94, 95, 95],
    lastAction: 'Compiled research summary on AI trends',
    actionsCount: 12,
  },
  {
    id: 'agent-4',
    name: 'Support Triage',
    status: 'running',
    trustScore: 89,
    trustTrend: [85, 86, 87, 88, 89, 89, 90, 89],
    lastAction: 'Routing customer requests to the right queue',
    actionsCount: 16,
  },
  {
    id: 'agent-5',
    name: 'Deployment Watcher',
    status: 'running',
    trustScore: 86,
    trustTrend: [82, 83, 84, 85, 86, 86, 85, 86],
    lastAction: 'Observing rollout status across services',
    actionsCount: 9,
  },
  {
    id: 'agent-6',
    name: 'Compliance Monitor',
    status: 'running',
    trustScore: 91,
    trustTrend: [88, 89, 90, 90, 91, 91, 92, 91],
    lastAction: 'Checking decisions for policy alignment',
    actionsCount: 7,
  },
];

function createTrend(baseValue: number, points = 8, drift = 2.5): number[] {
  const trend: number[] = [];
  let current = baseValue;

  for (let index = 0; index < points; index += 1) {
    current = Math.max(45, Math.min(99, current + (Math.random() - 0.5) * drift * 2));
    trend.push(Number(current.toFixed(1)));
  }

  return trend;
}

function pickIntegrations(actionType: string): IntegrationType[] {
  const preferred: Partial<Record<string, IntegrationType[]>> = {
    'email.': ['slack', 'gmail'],
    'calendar.': ['notion', 'gmail'],
    'research.': ['notion', 'github'],
  };

  const match = Object.entries(preferred).find(([prefix]) => actionType.startsWith(prefix));
  const seed = match?.[1] ?? INTEGRATION_OPTIONS;
  const count = Math.random() > 0.55 ? 2 : 1;
  return seed.slice(0, count);
}

function buildBusinessImpact(
  actionType: string,
  description: string,
  confidence: number,
  failed: boolean,
): string | undefined {
  if (!failed && confidence >= 0.8) {
    return undefined;
  }

  if (actionType.startsWith('email.')) {
    return 'This action affects customer-facing communication.';
  }

  if (actionType.startsWith('calendar.')) {
    return 'This may change team availability and meeting flow.';
  }

  if (actionType.startsWith('research.')) {
    return 'Manual review is recommended before sharing downstream.';
  }

  return description.includes('API')
    ? 'Incorrect execution may increase infrastructure cost.'
    : 'Manual review is recommended before deployment.';
}

export const MOCK_ACTIONS: AgentAction[] = [
  {
    id: 'action-1',
    agentId: 'agent-1',
    timestamp: new Date(Date.now() - 30000).toISOString(),
    actionType: 'email.send',
    description: 'Send follow-up email to project stakeholders',
    reasoning:
      'Project deadline approaching, stakeholders need status update. High confidence based on communication history.',
    confidence: 0.94,
    confidenceTrend: [90, 91, 92, 93, 94, 94, 93, 94],
    businessImpact: 'This action affects customer-facing communication.',
    integrations: ['slack', 'gmail'],
    status: 'done',
    decisionTrace: [
      { step: 'context_parsing', data: 'Detected pending project updates' },
      { step: 'intent_detection', data: 'User wants stakeholder communication' },
      {
        step: 'options_generated',
        data: ['Send email', 'Schedule meeting', 'Send Slack message'],
      },
      {
        step: 'final_decision',
        data: 'Send email',
        reasoning: 'Most formal and comprehensive communication method',
      },
    ],
    output: 'Email sent to 5 stakeholders with project update',
    retryCount: 0,
    approvalStatus: 'approved',
  },
  {
    id: 'action-2',
    agentId: 'agent-2',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    actionType: 'calendar.optimize',
    description: 'Consolidate morning meetings into single time block',
    reasoning: 'Back-to-back meetings cause context switching. Consolidation improves productivity.',
    confidence: 0.88,
    confidenceTrend: [83, 84, 85, 87, 88, 88, 87, 88],
    businessImpact: 'This may change team availability and meeting flow.',
    integrations: ['notion', 'gmail'],
    status: 'done',
    decisionTrace: [
      { step: 'context_parsing', data: '4 meetings scheduled in morning' },
      { step: 'intent_detection', data: 'Optimize meeting schedule' },
      {
        step: 'options_generated',
        data: ['Consolidate meetings', 'Move some to afternoon', 'Decline optional meetings'],
      },
      {
        step: 'final_decision',
        data: 'Consolidate meetings',
        reasoning: 'Maintains all important discussions, improves focus blocks',
      },
    ],
    output: 'Rescheduled 3 meetings to 10-11 AM block, freed afternoon for deep work',
    retryCount: 0,
    approvalStatus: 'approved',
  },
  {
    id: 'action-3',
    agentId: 'agent-3',
    timestamp: new Date(Date.now() - 90000).toISOString(),
    actionType: 'research.compile',
    description: 'Compile research on latest AI developments',
    reasoning: 'User asked for AI trends summary. Comprehensive research needed.',
    confidence: 0.91,
    confidenceTrend: [88, 89, 90, 90, 91, 92, 91, 91],
    businessImpact: 'Manual review is recommended before sharing downstream.',
    integrations: ['notion', 'github'],
    status: 'done',
    decisionTrace: [
      { step: 'context_parsing', data: 'User requested AI trends summary' },
      { step: 'intent_detection', data: 'Provide comprehensive research overview' },
      {
        step: 'options_generated',
        data: ['Web search + analysis', 'Use existing database', 'Query recent papers'],
      },
      {
        step: 'final_decision',
        data: 'Web search + analysis',
        reasoning: 'Most current and comprehensive approach for latest trends',
      },
    ],
    output: 'Compiled 15-page research summary covering transformers, multimodal AI, and agent systems',
    retryCount: 0,
    approvalStatus: 'approved',
  },
  {
    id: 'action-4a',
    agentId: 'agent-4',
    timestamp: new Date(Date.now() - 100000).toISOString(),
    actionType: 'support.route',
    description: 'Route urgent customer issue to senior support',
    reasoning: 'High-priority issue detected in incoming ticket metadata.',
    confidence: 0.86,
    confidenceTrend: [82, 83, 84, 85, 86, 86, 87, 86],
    businessImpact: 'This affects customer-facing communication.',
    integrations: ['slack', 'gmail'],
    status: 'done',
    decisionTrace: [
      { step: 'context_parsing', data: 'Urgent ticket with billing keyword detected' },
      { step: 'intent_detection', data: 'Escalate to senior support queue' },
      {
        step: 'options_generated',
        data: ['Route to frontline support', 'Escalate to senior support', 'Send automatic response'],
      },
      {
        step: 'final_decision',
        data: 'Escalate to senior support',
        reasoning: 'Best fit for urgent customer-facing issue',
      },
    ],
    output: 'Ticket moved to senior support queue with internal notification sent',
    retryCount: 0,
    approvalStatus: 'approved',
  },
  {
    id: 'action-5a',
    agentId: 'agent-5',
    timestamp: new Date(Date.now() - 130000).toISOString(),
    actionType: 'deploy.monitor',
    description: 'Watch production rollout for anomaly signals',
    reasoning: 'Deployment telemetry indicates minor variance that should be monitored.',
    confidence: 0.84,
    confidenceTrend: [80, 81, 82, 83, 84, 84, 84, 84],
    businessImpact: 'Incorrect execution may increase infrastructure cost.',
    integrations: ['github', 'slack'],
    status: 'done',
    decisionTrace: [
      { step: 'context_parsing', data: 'Deployment event streamed from CI pipeline' },
      { step: 'intent_detection', data: 'Monitor rollout health and anomalies' },
      {
        step: 'options_generated',
        data: ['Passively monitor', 'Pause rollout', 'Notify engineering channel'],
      },
      {
        step: 'final_decision',
        data: 'Notify engineering channel',
        reasoning: 'Provides visibility without interrupting rollout unnecessarily',
      },
    ],
    output: 'Deployment remains healthy. Slack alert posted for engineering visibility.',
    retryCount: 0,
    approvalStatus: 'approved',
  },
  {
    id: 'action-6a',
    agentId: 'agent-6',
    timestamp: new Date(Date.now() - 160000).toISOString(),
    actionType: 'policy.audit',
    description: 'Audit recent decisions for policy compliance',
    reasoning: 'Recent actions need a quick governance review before escalation.',
    confidence: 0.92,
    confidenceTrend: [89, 90, 90, 91, 91, 92, 91, 92],
    businessImpact: 'Manual review is recommended before deployment.',
    integrations: ['notion', 'github'],
    status: 'done',
    decisionTrace: [
      { step: 'context_parsing', data: 'Loaded recent governance-sensitive actions' },
      { step: 'intent_detection', data: 'Identify policy and compliance risks' },
      {
        step: 'options_generated',
        data: ['Summarize issues', 'Open manual review task', 'Archive as compliant'],
      },
      {
        step: 'final_decision',
        data: 'Open manual review task',
        reasoning: 'Best balance of oversight and operational clarity',
      },
    ],
    output: 'Compliance review task created in Notion with audit notes attached',
    retryCount: 0,
    approvalStatus: 'approved',
  },
  {
    id: 'action-4',
    agentId: 'agent-1',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    actionType: 'email.classify',
    description: 'Classify and archive old emails',
    reasoning: 'Inbox organization task. Low risk, high utility action.',
    confidence: 0.96,
    confidenceTrend: [94, 95, 95, 96, 96, 96, 96, 96],
    status: 'done',
    decisionTrace: [
      { step: 'context_parsing', data: '500+ emails in inbox older than 60 days' },
      { step: 'intent_detection', data: 'Organize and archive emails' },
      {
        step: 'options_generated',
        data: ['Archive all old emails', 'Manual review', 'Use filters'],
      },
      {
        step: 'final_decision',
        data: 'Archive all old emails',
        reasoning: 'Automated filtering is safe for old emails with no pending follow-ups',
      },
    ],
    output: 'Archived 487 emails from 2024 into respective project folders',
    retryCount: 0,
    approvalStatus: 'approved',
  },
  {
    id: 'action-5',
    agentId: 'agent-2',
    timestamp: new Date(Date.now() - 150000).toISOString(),
    actionType: 'calendar.suggest',
    description: 'Suggest best time for team standup meeting',
    reasoning: 'Need to schedule recurring standup. Using availability patterns to find optimal time.',
    confidence: 0.82,
    confidenceTrend: [78, 79, 81, 82, 82, 83, 82, 82],
    businessImpact: 'Manual review is recommended before deployment.',
    integrations: ['slack'],
    status: 'pending',
    decisionTrace: [
      { step: 'context_parsing', data: 'Team availability data analyzed for 5 members' },
      { step: 'intent_detection', data: 'Find optimal standup time' },
      {
        step: 'options_generated',
        data: ['9 AM daily', '10 AM daily', '2 PM daily'],
      },
      {
        step: 'final_decision',
        data: '9:30 AM daily',
        reasoning: 'Accommodates 80% availability, early enough for productivity without too early',
      },
    ],
    output: 'Recommended 9:30 AM - 9:45 AM for daily standup meeting',
    retryCount: 0,
    approvalStatus: 'pending',
  },
];

export const MOCK_RULES: AgentRule[] = [
  {
    id: 'rule-1',
    agentId: 'agent-1',
    condition: 'Email from VIP contact OR contains "urgent"',
    instruction: 'Always notify user immediately and do not auto-respond',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    enabled: true,
  },
  {
    id: 'rule-2',
    agentId: 'agent-1',
    condition: 'Promotional emails OR newsletters',
    instruction: 'Auto-archive to "Newsletters" folder, mark as read',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    enabled: true,
  },
  {
    id: 'rule-3',
    agentId: 'agent-2',
    condition: 'Meeting duration > 2 hours AND low priority',
    instruction: 'Automatically suggest splitting into multiple sessions',
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    enabled: true,
  },
  {
    id: 'rule-4',
    agentId: 'agent-2',
    condition: 'Conflicting meetings detected',
    instruction: 'Ask user for resolution, do not auto-reschedule',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    enabled: true,
  },
];

// Action templates for simulating new actions
const ACTION_TEMPLATES = [
  {
    agentId: 'agent-1',
    actionType: 'email.send',
    description: 'Send reminder email to team members',
    reasoning: 'Weekly reminder for outstanding action items',
  },
  {
    agentId: 'agent-1',
    actionType: 'email.summarize',
    description: 'Create summary of daily email threads',
    reasoning: 'User requested daily digest format',
  },
  {
    agentId: 'agent-2',
    actionType: 'calendar.adjust',
    description: 'Adjust meeting end times for better transitions',
    reasoning: 'Adding buffer time reduces stress and improves focus',
  },
  {
    agentId: 'agent-2',
    actionType: 'calendar.block',
    description: 'Block time for deep work and focused tasks',
    reasoning: 'Protecting maker time improves productivity and code quality',
  },
  {
    agentId: 'agent-3',
    actionType: 'research.analyze',
    description: 'Analyze recent market trends in AI',
    reasoning: 'User interested in competitive landscape updates',
  },
  {
    agentId: 'agent-3',
    actionType: 'research.summarize',
    description: 'Create executive summary of research findings',
    reasoning: 'Condensed format for quick executive review',
  },
  {
    agentId: 'agent-4',
    actionType: 'support.route',
    description: 'Route urgent customer issue to senior support',
    reasoning: 'High-priority issue detected in incoming ticket metadata',
  },
  {
    agentId: 'agent-5',
    actionType: 'deploy.monitor',
    description: 'Watch production rollout for anomaly signals',
    reasoning: 'Deployment telemetry shows variance worth monitoring',
  },
  {
    agentId: 'agent-6',
    actionType: 'policy.audit',
    description: 'Audit recent decisions for policy compliance',
    reasoning: 'Governance review required for recent actions',
  },
];

export function generateMockAction(): AgentAction {
  const template = ACTION_TEMPLATES[Math.floor(Math.random() * ACTION_TEMPLATES.length)]!;
  const id = `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const confidence = 0.75 + Math.random() * 0.25;
  const isSuccess = Math.random() > 0.15; // 85% success rate
  const trend = createTrend(confidence * 100, 8, isSuccess ? 2.2 : 4.2);
  const businessImpact = buildBusinessImpact(template.actionType, template.description, confidence, !isSuccess);

  return {
    id,
    agentId: template.agentId,
    timestamp: new Date().toISOString(),
    actionType: template.actionType,
    description: template.description,
    reasoning: template.reasoning,
    confidence,
    confidenceTrend: trend,
    businessImpact,
    integrations: pickIntegrations(template.actionType),
    status: isSuccess ? 'done' : Math.random() > 0.5 ? 'failed' : 'pending',
    decisionTrace: [
      { step: 'context_parsing', data: 'Analyzing current context' },
      { step: 'intent_detection', data: 'Detected user intent' },
      {
        step: 'options_generated',
        data: [template.description, 'Alternative action 1', 'Alternative action 2'],
      },
      {
        step: 'final_decision',
        data: template.description,
        reasoning: template.reasoning,
      },
    ],
    output: `Successfully completed: ${template.description}`,
    retryCount: 0,
    approvalStatus: 'approved',
  };
}
