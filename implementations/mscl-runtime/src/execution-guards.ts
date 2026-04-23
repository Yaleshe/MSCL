import type { ActionProposal, ExecToken, ProposalRiskLevel } from "./types.js";

export const EXECUTION_TIMESTAMP = "2026-04-13T10:01:00Z";

const RISK_ORDER: Record<ProposalRiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

export function getExecTokenBlockReason(
  proposal: ActionProposal,
  execToken: ExecToken,
  atTimestamp = EXECUTION_TIMESTAMP,
): string | undefined {
  if (new Date(execToken.valid_until).getTime() < new Date(atTimestamp).getTime()) {
    return `ExecToken expired at ${execToken.valid_until}.`;
  }

  const recipientConstraint = execToken.constraints.find(
    (constraint): constraint is Extract<ExecToken["constraints"][number], { type: "recipient_scope" }> =>
      constraint.type === "recipient_scope",
  );
  if (!recipientConstraint?.allowed_recipients.includes(proposal.action_proposal.raw.to)) {
    return `ExecToken does not authorize recipient ${proposal.action_proposal.raw.to}.`;
  }

  const riskConstraint = execToken.constraints.find(
    (constraint): constraint is Extract<ExecToken["constraints"][number], { type: "risk_ceiling" }> =>
      constraint.type === "risk_ceiling",
  );
  if (
    riskConstraint &&
    RISK_ORDER[proposal.action_proposal.normalized.risk_level] >
      RISK_ORDER[riskConstraint.max_risk_level]
  ) {
    return `ExecToken risk ceiling ${riskConstraint.max_risk_level} does not allow ${proposal.action_proposal.normalized.risk_level}.`;
  }

  return undefined;
}
