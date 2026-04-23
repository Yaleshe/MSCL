import { EXECUTION_TIMESTAMP, getExecTokenBlockReason } from "./execution-guards.js";
import { evaluateSemanticActionPolicy } from "./policies/semantic-action-policy.js";
const INITIAL_STATE = {
    sent_emails: [],
};
function cloneState(state) {
    return structuredClone(state);
}
export class InMemoryMsclEngine {
    state;
    records;
    constructor() {
        this.state = cloneState(INITIAL_STATE);
        this.records = [];
    }
    reset() {
        this.state = cloneState(INITIAL_STATE);
        this.records = [];
        return this.getState();
    }
    getState() {
        return cloneState(this.state);
    }
    getRecords() {
        return structuredClone(this.records);
    }
    runSemanticEmailScenario() {
        return this.runProposal(this.buildApprovedProposal());
    }
    runRejectedSemanticEmailScenario() {
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
    runExpiredTokenScenario() {
        return this.runApprovedProposalWithTokenMutation(this.buildApprovedProposal(), (token) => ({
            ...token,
            id: "token-expired-001",
            valid_until: "2026-04-13T09:59:00Z",
        }));
    }
    runRecipientScopeFailureScenario() {
        return this.runApprovedProposalWithTokenMutation(this.buildApprovedProposal(), (token) => ({
            ...token,
            id: "token-recipient-scope-001",
            constraints: token.constraints.map((constraint) => constraint.type === "recipient_scope"
                ? {
                    type: "recipient_scope",
                    allowed_recipients: ["internal@openclaw.local"],
                }
                : constraint),
        }));
    }
    runProposal(proposal) {
        const decision = this.evaluateProposal(proposal);
        if (decision.result !== "approved") {
            const blockedExecution = {
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
    buildApprovedProposal() {
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
    runApprovedProposalWithTokenMutation(proposal, mutateToken) {
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
    evaluateProposal(proposal) {
        return evaluateSemanticActionPolicy(proposal);
    }
    issueExecToken(proposal, decision) {
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
    executeProposal(proposal, execToken) {
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
    recordRun(proposal, decision, execToken, execution) {
        const record = {
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
    recordRejectedRun(proposal, decision, execution) {
        const record = {
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
