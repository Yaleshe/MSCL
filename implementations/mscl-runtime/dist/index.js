import { createServer } from "node:http";
import { inspect } from "node:util";
import { InMemoryMsclEngine } from "./engine.js";
import { getSemanticActionPolicyDocument } from "./policies/semantic-action-policy.js";
function sendJson(response, statusCode, value) {
    response.writeHead(statusCode, {
        "content-type": "application/json; charset=utf-8",
    });
    response.end(JSON.stringify(value, null, 2));
}
async function readJsonBody(request) {
    const chunks = [];
    for await (const chunk of request) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const text = Buffer.concat(chunks).toString("utf8").trim();
    if (!text) {
        return {};
    }
    return JSON.parse(text);
}
function isRiskLevel(value) {
    return value === "low" || value === "medium" || value === "high";
}
function isTarget(value) {
    return value === "internal" || value === "external";
}
function isSource(value) {
    return value === "agent" || value === "user" || value === "system";
}
function validateActionProposal(payload) {
    if (!payload || typeof payload !== "object") {
        return { ok: false, error: "Payload must be a JSON object." };
    }
    const value = payload;
    const actor = value.actor;
    const context = value.context;
    const semantic = value.action_proposal;
    const raw = semantic?.raw;
    const normalized = semantic?.normalized;
    if (typeof value.id !== "string" || !value.id.trim()) {
        return { ok: false, error: "Proposal id is required." };
    }
    if (!actor || typeof actor.id !== "string" || typeof actor.role !== "string") {
        return { ok: false, error: "actor.id and actor.role are required." };
    }
    if (actor.role !== "operator" && actor.role !== "viewer" && actor.role !== "system") {
        return { ok: false, error: "actor.role must be operator, viewer, or system." };
    }
    if (!context || !isSource(context.source) || typeof context.timestamp !== "string") {
        return { ok: false, error: "context.source and context.timestamp are required." };
    }
    if (!semantic || semantic.type !== "send_email") {
        return { ok: false, error: "action_proposal.type must be send_email." };
    }
    if (!raw || typeof raw.to !== "string" || !raw.to.trim()) {
        return { ok: false, error: "action_proposal.raw.to is required." };
    }
    if (!normalized ||
        normalized.category !== "communication" ||
        !isTarget(normalized.target) ||
        !isRiskLevel(normalized.risk_level)) {
        return {
            ok: false,
            error: "action_proposal.normalized must include category=communication, target, and risk_level.",
        };
    }
    return {
        ok: true,
        proposal: {
            id: value.id,
            actor: {
                id: actor.id,
                role: actor.role,
            },
            action_proposal: {
                type: "send_email",
                raw: {
                    to: raw.to,
                    subject: typeof raw.subject === "string" ? raw.subject : undefined,
                    body: typeof raw.body === "string" ? raw.body : undefined,
                },
                normalized: {
                    category: "communication",
                    target: normalized.target,
                    risk_level: normalized.risk_level,
                },
            },
            context: {
                source: context.source,
                timestamp: context.timestamp,
            },
        },
    };
}
function startServer(port = 8787, host = "127.0.0.1") {
    const engine = new InMemoryMsclEngine();
    const server = createServer(async (request, response) => {
        const method = request.method ?? "GET";
        const url = request.url ?? "/";
        if (method === "GET" && url === "/health") {
            sendJson(response, 200, { ok: true, service: "mscl-runtime" });
            return;
        }
        if (method === "GET" && url === "/state") {
            sendJson(response, 200, engine.getState());
            return;
        }
        if (method === "GET" && url === "/records") {
            sendJson(response, 200, engine.getRecords());
            return;
        }
        if (method === "GET" && url === "/policies/current") {
            sendJson(response, 200, getSemanticActionPolicyDocument());
            return;
        }
        if (method === "POST" && url === "/demo/reset") {
            sendJson(response, 200, {
                status: "reset",
                state: engine.reset(),
            });
            return;
        }
        if (method === "POST" && url === "/demo/send-email/run") {
            sendJson(response, 200, engine.runSemanticEmailScenario());
            return;
        }
        if (method === "POST" && url === "/demo/send-email/rejected-run") {
            sendJson(response, 200, engine.runRejectedSemanticEmailScenario());
            return;
        }
        if (method === "POST" && url === "/demo/send-email/expired-token-run") {
            sendJson(response, 200, engine.runExpiredTokenScenario());
            return;
        }
        if (method === "POST" && url === "/demo/send-email/recipient-scope-failure-run") {
            sendJson(response, 200, engine.runRecipientScopeFailureScenario());
            return;
        }
        if (method === "POST" && url === "/proposals") {
            try {
                const payload = await readJsonBody(request);
                const validated = validateActionProposal(payload);
                if (!validated.ok) {
                    sendJson(response, 400, {
                        error: "invalid_proposal",
                        message: validated.error,
                    });
                    return;
                }
                sendJson(response, 200, engine.runProposal(validated.proposal));
                return;
            }
            catch (error) {
                sendJson(response, 400, {
                    error: "invalid_json",
                    message: error instanceof Error ? error.message : String(error),
                });
                return;
            }
        }
        sendJson(response, 404, {
            error: "not_found",
            method,
            url,
        });
    });
    server.listen(port, host, () => {
        console.log(`MSCL demo server listening on http://${host}:${port}`);
    });
}
function runDemo() {
    const engine = new InMemoryMsclEngine();
    console.log("Initial state:");
    console.log(inspect(engine.getState(), { depth: null, colors: false }));
    console.log("");
    const result = engine.runSemanticEmailScenario();
    console.log("Loop result:");
    console.log(inspect(result, { depth: null, colors: false }));
    console.log("");
    console.log("Final state:");
    console.log(inspect(engine.getState(), { depth: null, colors: false }));
}
const command = process.argv[2] ?? "run-demo";
if (command === "server") {
    startServer();
}
else if (command === "run-demo") {
    runDemo();
}
else {
    console.error(`Unknown command: ${command}`);
    process.exit(1);
}
