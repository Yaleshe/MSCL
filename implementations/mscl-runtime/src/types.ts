export type Actor = {
  id: string;
  role: "operator" | "viewer" | "system";
};

export type ProposalType = "send_email";
export type ProposalCategory = "communication";
export type ProposalTarget = "internal" | "external";
export type ProposalRiskLevel = "low" | "medium" | "high";
export type ProposalSource = "agent" | "user" | "system";

export type SemanticActionProposal = {
  type: ProposalType;
  raw: {
    to: string;
    subject?: string;
    body?: string;
  };
  normalized: {
    category: ProposalCategory;
    target: ProposalTarget;
    risk_level: ProposalRiskLevel;
  };
};

export type ActionProposal = {
  id: string;
  actor: Actor;
  action_proposal: SemanticActionProposal;
  context: {
    source: ProposalSource;
    timestamp: string;
  };
};

export type PolicyEvaluation = {
  policy: string;
  result: "pass" | "fail";
  reason?: string;
};

export type Decision = {
  id: string;
  proposal_id: string;
  result: "approved" | "rejected";
  policy_evaluations: PolicyEvaluation[];
  conditions: string[];
};

export type ExecToken = {
  id: string;
  issued_by: string;
  proposal_id: string;
  decision_id: string;
  approved_action: {
    type: ProposalType;
    target: ProposalTarget;
    risk_level: ProposalRiskLevel;
  };
  constraints: Array<
    | {
        type: "recipient_scope";
        allowed_recipients: string[];
      }
    | {
        type: "risk_ceiling";
        max_risk_level: ProposalRiskLevel;
      }
  >;
  valid_until: string;
};

export type SentEmail = {
  id: string;
  to: string;
  subject: string;
  body: string;
  target: ProposalTarget;
  risk_level: ProposalRiskLevel;
  status: "sent";
  sent_at: string;
};

export type DemoState = {
  sent_emails: SentEmail[];
};

export type Execution = {
  id: string;
  proposal_id: string;
  exec_token_id: string;
  status: "success" | "blocked";
  before_state: DemoState;
  after_state: DemoState;
  timestamp: string;
  executor: string;
  message?: string;
};

export type AuditRecord = {
  id: string;
  proposal: ActionProposal;
  decision: Decision;
  exec_token?: ExecToken;
  execution: Execution;
  state: DemoState;
  recorded_at: string;
};

export type RunResult = {
  proposal: ActionProposal;
  decision: Decision;
  execToken?: ExecToken;
  execution: Execution;
  state: DemoState;
  record?: AuditRecord;
};
