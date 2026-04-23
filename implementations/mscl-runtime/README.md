# MSCL Runtime (Reference Implementation)

A minimal governed execution runtime for the MSCL model.

This implementation exposes the core control loop as a local HTTP runtime:

`ActionProposal → Decision → ExecToken → Execution → State → Record`

It is not tied to any specific domain.Instead, it provides the invariant execution layer that domain scenarios build on top of.

---

## What This Runtime Does

The runtime accepts structured `ActionProposal`s and:

- normalizes and classifies actions  
- evaluates them against centralized policy  
- produces an explicit `Decision`  
- issues an `ExecToken` when allowed  
- executes against a controlled state model  
- records the full execution trace  

---

## Control Loop

`ActionProposal → Decision → ExecToken → Execution → State → Record`


---

## Run

Install dependencies:

npm install

Start the runtime:

npm start

Try It,Once the server is running, open another terminal and run:
1. Health check
   
HTTPS_PROXY= HTTP_PROXY= ALL_PROXY= https_proxy= http_proxy= all_proxy= \
curl http://127.0.0.1:8787/health

2. Allowed action (execution happens)

HTTPS_PROXY= HTTP_PROXY= ALL_PROXY= https_proxy= http_proxy= all_proxy= \
curl -X POST http://127.0.0.1:8787/demo/send-email/run

Expected:

decision = approved
execution = success
state updated

3. Blocked action (no execution)

HTTPS_PROXY= HTTP_PROXY= ALL_PROXY= https_proxy= http_proxy= all_proxy= \
curl -X POST http://127.0.0.1:8787/demo/send-email/rejected-run

Expected:

decision = denied
execution = not performed

Example

Submit an action:

curl -X POST http://127.0.0.1:8787/proposals \
  -H 'content-type: application/json' \
  --data '{
    "id": "ap-001",
    "actor": { "id": "user-001", "role": "operator" },
    "action_proposal": {
      "type": "send_email",
      "raw": {
        "to": "external@client.com",
        "subject": "Contract update"
      },
      "normalized": {
        "category": "communication",
        "target": "external",
        "risk_level": "high"
      }
    }
  }'

## Local Testing Note

If you use a local HTTP proxy, bypass it for localhost when testing.Otherwise, requests to 127.0.0.1 may fail with a 502 Bad Gateway error.

HTTPS_PROXY= HTTP_PROXY= ALL_PROXY= https_proxy= http_proxy= all_proxy= \
curl http://127.0.0.1:8787/health

Kernel vs. Domain Evolution:

MSCL is designed as an invariant execution control layer.

The control loop remains stable across domains.

What evolves is the semantic layer built on top:

new action types
richer normalization rules
reusable policy patterns
domain abstractions

Over time, these accumulate into a shared semantic layer.

Each scenario contributes structure that improves the system globally.

This is how the system scales.

Related:

MSCL model: yaleshe/MSCL/README.md
Scenario example: yaleshe/MSCL/scenarios/agent-action-firewall/