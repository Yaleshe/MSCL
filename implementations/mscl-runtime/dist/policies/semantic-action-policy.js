import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
function loadPolicyDocument() {
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const filePath = path.join(currentDir, "semantic-action-policy.json");
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}
export const SEMANTIC_ACTION_POLICY = loadPolicyDocument();
export const INTERNAL_EMAIL_DOMAIN = SEMANTIC_ACTION_POLICY.constants.internal_email_domain;
export function getSemanticActionPolicyDocument() {
    return structuredClone(SEMANTIC_ACTION_POLICY);
}
export function classifyRecipient(email) {
    const normalized = email.trim().toLowerCase();
    return normalized.endsWith(`@${INTERNAL_EMAIL_DOMAIN}`) ? "internal" : "external";
}
function getValueByPath(source, field) {
    const parts = field.split(".");
    let current = source;
    for (const part of parts) {
        if (!current || typeof current !== "object") {
            return undefined;
        }
        current = current[part];
    }
    return current;
}
function renderTemplate(template, values) {
    return template.replace(/\{([^}]+)\}/g, (_, key) => values[key] ?? "");
}
function evaluatePredicate(proposal, predicate, context) {
    const actualValue = getValueByPath(proposal, predicate.field);
    const actual = typeof actualValue === "string" ? actualValue : undefined;
    if (predicate.kind === "field_equals") {
        return { pass: actual === predicate.expected, actual, expected: predicate.expected };
    }
    if (predicate.kind === "field_not_equals") {
        return { pass: actual !== predicate.expected, actual, expected: predicate.expected };
    }
    if (predicate.kind === "field_nonempty") {
        return { pass: typeof actual === "string" && actual.trim().length > 0, actual };
    }
    return {
        pass: actual === context[predicate.context_key],
        actual,
        expected: context[predicate.context_key],
    };
}
function evaluateRule(proposal, rule, context) {
    if (rule.kind === "any_of") {
        const pass = rule.branches.some((branch) => branch.all.every((predicate) => evaluatePredicate(proposal, predicate, context).pass));
        return {
            policy: rule.id,
            result: pass ? "pass" : "fail",
            reason: pass ? undefined : rule.failure_reason,
        };
    }
    if (rule.kind === "forbid_all") {
        const matched = rule.conditions.every((predicate) => evaluatePredicate(proposal, predicate, context).pass);
        return {
            policy: rule.id,
            result: matched ? "fail" : "pass",
            reason: matched ? rule.failure_reason : undefined,
        };
    }
    const predicateResult = evaluatePredicate(proposal, rule, context);
    const reason = !predicateResult.pass
        ? rule.failure_reason_template
            ? renderTemplate(rule.failure_reason_template, {
                actual: predicateResult.actual,
                expected: predicateResult.expected,
                normalizedTarget: predicateResult.actual,
                derivedTarget: predicateResult.expected,
            })
            : rule.failure_reason
        : undefined;
    return {
        policy: rule.id,
        result: predicateResult.pass ? "pass" : "fail",
        reason,
    };
}
export function evaluateSemanticActionPolicy(proposal) {
    const policyEvaluations = [];
    const context = {
        derived_target: classifyRecipient(proposal.action_proposal.raw.to),
    };
    for (const rule of SEMANTIC_ACTION_POLICY.rules) {
        policyEvaluations.push(evaluateRule(proposal, rule, context));
    }
    const approved = policyEvaluations.every((evaluation) => evaluation.result === "pass");
    return {
        id: "decision-001",
        proposal_id: proposal.id,
        result: approved ? "approved" : "rejected",
        policy_evaluations: policyEvaluations,
        conditions: [],
    };
}
