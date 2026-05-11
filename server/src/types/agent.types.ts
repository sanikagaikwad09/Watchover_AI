export type AgentStatus = 'running' | 'paused' | 'idle' | 'error';

export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  trustScore: number;
  trustTrend?: number[];
  lastAction: string;
  actionsCount: number;
}

export type ActionStatus = 'pending' | 'done' | 'interrupted' | 'failed';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface DecisionTraceContextParsing {
  step: 'context_parsing';
  data: string;
}

export interface DecisionTraceIntentDetection {
  step: 'intent_detection';
  data: string;
}

export interface DecisionTraceOptionsGenerated {
  step: 'options_generated';
  data: string[];
}

export interface DecisionTraceFinalDecision {
  step: 'final_decision';
  data: string;
  reasoning: string;
}

export type DecisionTraceStep =
  | DecisionTraceContextParsing
  | DecisionTraceIntentDetection
  | DecisionTraceOptionsGenerated
  | DecisionTraceFinalDecision;

export interface AgentAction {
  id: string;
  agentId: string;
  timestamp: string;
  actionType: string;
  description: string;
  reasoning: string;
  confidence: number;
  status: ActionStatus;
  decisionTrace: DecisionTraceStep[];
  output: string;
  correctedOutput?: string;
  humanCorrected?: boolean;
  retryCount: number;
  errorReason?: string;
  fallbackOption?: string;
  approvalStatus?: ApprovalStatus;
}

export interface AgentRule {
  id: string;
  agentId: string;
  condition: string;
  instruction: string;
  createdAt: string;
  enabled: boolean;
}
