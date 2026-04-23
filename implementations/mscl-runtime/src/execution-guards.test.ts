import test from "node:test";
import assert from "node:assert/strict";
import { EXECUTION_TIMESTAMP, getExecTokenBlockReason } from "./execution-guards.js";
import type { ActionProposal, ExecToken } from "./types.js";

function makeProposal(): ActionProposal {
  return {
    id: "ap-guard-001",
    actor: { id: "user-001", role: "operator" },
    action_proposal: {
      type: "send_email",
      raw: {
        to: "external@client.com",
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

function makeToken(): ExecToken {
  return {
    id: "token-guard-001",
    issued_by: "policy-engine",
    proposal_id: "ap-guard-001",
    decision_id: "decision-001",
    approved_action: {
      type: "send_email",
      target: "external",
      risk_level: "high",
    },
    constraints: [
      {
        type: "recipient_scope",
        allowed_recipients: ["external@client.com"],
      },
      {
        type: "risk_ceiling",
        max_risk_level: "high",
      },
    ],
    valid_until: "2026-04-13T10:05:00Z",
  };
}

test("execution guard blocks expired token", () => {
  const reason = getExecTokenBlockReason(makeProposal(), {
    ...makeToken(),
    valid_until: "2026-04-13T09:59:00Z",
  });
  assert.equal(reason, "ExecToken expired at 2026-04-13T09:59:00Z.");
});

test("execution guard blocks unauthorized recipient", () => {
  const reason = getExecTokenBlockReason(makeProposal(), {
    ...makeToken(),
    constraints: [
      {
        type: "recipient_scope",
        allowed_recipients: ["internal@openclaw.local"],
      },
      {
        type: "risk_ceiling",
        max_risk_level: "high",
      },
    ],
  });
  assert.equal(reason, "ExecToken does not authorize recipient external@client.com.");
});

test("execution guard allows valid token", () => {
  const reason = getExecTokenBlockReason(makeProposal(), makeToken(), EXECUTION_TIMESTAMP);
  assert.equal(reason, undefined);
});
