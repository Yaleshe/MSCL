import test from "node:test";
import assert from "node:assert/strict";
import { evaluateSemanticActionPolicy, getSemanticActionPolicyDocument } from "./semantic-action-policy.js";
function makeProposal(overrides = {}) {
    return {
        id: "ap-test-001",
        actor: {
            id: "user-001",
            role: "operator",
        },
        action_proposal: {
            type: "send_email",
            raw: {
                to: "external@client.com",
                subject: "Contract update",
                body: "Approved.",
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
        ...overrides,
    };
}
test("semantic policy approves valid operator external email", () => {
    const decision = evaluateSemanticActionPolicy(makeProposal());
    assert.equal(decision.result, "approved");
    assert.equal(decision.policy_evaluations.every((evaluation) => evaluation.result === "pass"), true);
});
test("semantic policy rejects viewer sending high-risk external email", () => {
    const decision = evaluateSemanticActionPolicy(makeProposal({
        actor: { id: "user-002", role: "viewer" },
    }));
    assert.equal(decision.result, "rejected");
    assert.equal(decision.policy_evaluations.some((evaluation) => evaluation.policy === "semantic_action_policy.actor_authorized" &&
        evaluation.result === "fail"), true);
});
test("semantic policy rejects mismatched normalized target", () => {
    const decision = evaluateSemanticActionPolicy(makeProposal({
        action_proposal: {
            type: "send_email",
            raw: {
                to: "external@client.com",
            },
            normalized: {
                category: "communication",
                target: "internal",
                risk_level: "high",
            },
        },
    }));
    assert.equal(decision.result, "rejected");
    assert.equal(decision.policy_evaluations.some((evaluation) => evaluation.policy === "semantic_action_policy.normalized_target_matches_raw" &&
        evaluation.result === "fail"), true);
});
test("semantic policy document is loaded from separate file", () => {
    const document = getSemanticActionPolicyDocument();
    assert.equal(document.policy_id, "semantic_action_policy");
    assert.equal(document.constants.supported_type, "send_email");
    assert.equal(document.constants.internal_email_domain, "openclaw.local");
    assert.equal(Array.isArray(document.rules), true);
    assert.equal(document.rules.length > 0, true);
});
