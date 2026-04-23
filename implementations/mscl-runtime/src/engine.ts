import { EXECUTION_TIMESTAMP, getExecTokenBlockReason } from "./execution-guards.js";
import { evaluateSemanticActionPolicy } from "./policies/semantic-action-policy.js";
import type {
  ActionProposal,
  AuditRecord,
  Decision,
  DemoState,
  ExecToken,
  Execution,
  RunResult,
} from "./types.js";

const INITIAL_STATE: DemoState = {
  sent_emails: [],
};

function cloneState(state: DemoState): DemoState {
  return structuredClone(state);
}

export class InMemoryMsclEngine {
  private state: DemoState;

  private records: AuditRecord[];

  constructor() {
    this.state = cloneState(INITIAL_STATE);
    this.records = [];
  }

  reset(): DemoState {
    this.state = cloneState(INITIAL_STATE);
    this.records = [];
    return this.getState();
  }

  getState(): DemoState {
    return cloneState(this.state);
  }

  getRecords(): AuditRecord[] {
    return structuredClone(this.records);
  }

  runSemanticEmailScenario(): RunResult {
    return this.runProposal(this.buildApprovedProposal());
  }

  runRejectedSemanticEmailScenario(): RunResult {
    return this.runProposal({
      id: "ap-reject-001",
      actor: {
        id: "user-002",
        role: "viewer",
      },
      action_proposal: {
        type: "send_email",
        raw: {
          to: "external@client.com",
          subject: "Unauthorized outbound email",
          body: "This should be rejected by policy.",
        },
        normalized: {
          category: "communication",
          target: "external",
          risk_level: "high",
        },
      },
      context: {
        source: "agent",
        timestamp: "2026-04-13T10:02:00Z",
      },
    });
  }

  runExpiredTokenScenario(): RunResult {
    return this.runApprovedProposalWithTokenMutation(this.buildApprovedProposal(), (token) => ({
      ...token,
      id: "token-expired-001",
      valid_until: "2026-04-13T09:59:00Z",
    }));
  }

  runRecipientScopeFailureScenario(): RunResult {
    return this.runApprovedProposalWithTokenMutation(this.buildApprovedProposal(), (token) => ({
      ...token,
      id: "token-recipient-scope-001",
      constraints: token.constraints.map((constraint) =>
        constraint.type === "recipient_scope"
          ? {
              type: "recipient_scope" as const,
              allowed_recipients: ["internal@openclaw.local"],
            }
          : constraint,
      ),
    }));
  }

  runProposal(proposal: ActionProposal): RunResult {
    const decision = this.evaluateProposal(proposal);
    if (decision.result !== "approved") {
      const blockedExecution: Execution = {
        id: "exec-001",
        proposal_id: proposal.id,
        exec_token_id: "none",
        status: "blocked",
        before_state: this.getState(),
        after_state: this.getState(),
        timestamp: EXECUTION_TIMESTAMP,
        executor: "workflow-engine",
        message: "Decision rejected the proposal. No ExecToken issued.",
      };
      const record = this.recordRejectedRun(proposal, decision, blockedExecution);
      return {
        proposal,
        decision,
        execution: blockedExecution,
        state: this.getState(),
        record,
      };
    }

    const execToken = this.issueExecToken(proposal, decision);
    const execution = this.executeProposal(proposal, execToken);
    const record = this.recordRun(proposal, decision, execToken, execution);

    return {
      proposal,
      decision,
      execToken,
      execution,
      state: this.getState(),
      record,
    };
  }

  private buildApprovedProposal(): ActionProposal {
    return {
      id: "ap-001",
      actor: {
        id: "user-001",
        role: "operator",
      },
      action_proposal: {
        type: "send_email",
        raw: {
          to: "external@client.com",
          subject: "Contract update",
          body: "Approved. Sending the updated contract as discussed.",
        },
        normalized: {
          category: "communication",
          target: "external",
          risk_level: "high",
        },
      },
      context: {
        source: "agent",
        timestamp: "2026-04-13T10:00:00Z",
      },
    };
  }

  private runApprovedProposalWithTokenMutation(
    proposal: ActionProposal,
    mutateToken: (token: ExecToken) => ExecToken,
  ): RunResult {
    const decision = this.evaluateProposal(proposal);
    const baseToken = this.issueExecToken(proposal, decision);
    const execToken = mutateToken(baseToken);
    const execution = this.executeProposal(proposal, execToken);
    const record = this.recordRun(proposal, decision, execToken, execution);
    return {
      proposal,
      decision,
      execToken,
      execution,
      state: this.getState(),
      record,
    };
  }

  private evaluateProposal(proposal: ActionProposal): Decision {
    return evaluateSemanticActionPolicy(proposal);
  }

  private issueExecToken(proposal: ActionProposal, decision: Decision): ExecToken {
    const semantic = proposal.action_proposal;
    return {
      id: "token-001",
      issued_by: "policy-engine",
      proposal_id: proposal.id,
      decision_id: decision.id,
      approved_action: {
        type: semantic.type,
        target: semantic.normalized.target,
        risk_level: semantic.normalized.risk_level,
      },
      constraints: [
        {
          type: "recipient_scope",
          allowed_recipients: [semantic.raw.to],
        },
        {
          type: "risk_ceiling",
          max_risk_level: semantic.normalized.risk_level,
        },
      ],
      valid_until: "2026-04-13T10:05:00Z",
    };
  }

  private executeProposal(proposal: ActionProposal, execToken: ExecToken): Execution {
    const beforeState = this.getState();
    const semantic = proposal.action_proposal;
    const blockReason = getExecTokenBlockReason(proposal, execToken, EXECUTION_TIMESTAMP);
    if (blockReason) {
      return {
        id: "exec-001",
        proposal_id: proposal.id,
        exec_token_id: execToken.id,
        status: "blocked",
        before_state: beforeState,
        after_state: this.getState(),
        timestamp: EXECUTION_TIMESTAMP,
        executor: "workflow-engine",
        message: blockReason,
      };
    }

    this.state.sent_emails.push({
      id: `email-${this.state.sent_emails.length + 1}`,
      to: semantic.raw.to,
      subject: semantic.raw.subject ?? "",
      body: semantic.raw.body ?? "",
      target: semantic.normalized.target,
      risk_level: semantic.normalized.risk_level,
      status: "sent",
      sent_at: EXECUTION_TIMESTAMP,
    });

    return {
      id: "exec-001",
      proposal_id: proposal.id,
      exec_token_id: execToken.id,
      status: "success",
      before_state: beforeState,
      after_state: this.getState(),
      timestamp: EXECUTION_TIMESTAMP,
      executor: "workflow-engine",
    };
  }

  private recordRun(
    proposal: ActionProposal,
    decision: Decision,
    execToken: ExecToken,
    execution: Execution,
  ): AuditRecord {
    const record: AuditRecord = {
      id: `record-${this.records.length + 1}`,
      proposal,
      decision,
      exec_token: execToken,
      execution,
      state: this.getState(),
      recorded_at: new Date().toISOString(),
    };
    this.records.push(record);
    return structuredClone(record);
  }

  private recordRejectedRun(
    proposal: ActionProposal,
    decision: Decision,
    execution: Execution,
  ): AuditRecord {
    const record: AuditRecord = {
      id: `record-${this.records.length + 1}`,
      proposal,
      decision,
      execution,
      state: this.getState(),
      recorded_at: new Date().toISOString(),
    };
    this.records.push(record);
    return structuredClone(record);
  }
}
