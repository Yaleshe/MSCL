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

## Architecture Diagram 

              ┌──────────────────────┐
              │   ActionProposal     │
              │ (intent from agent)  │
              └─────────┬────────────┘
                        ↓
              ┌──────────────────────┐
              │      Decision        │
              │ (policy evaluation)  │
              └───────┬───────┬──────┘
                      │       │
                 APPROVED   DENIED
                      │       │
                      ↓       ↓
         ┌────────────────┐   │
         │   ExecToken    │   │
         │ (authorization)│   │
         └───────┬────────┘   │
                 ↓            │
         ┌────────────────┐   │
         │   Execution    │   │
         │ (side-effect)  │   │
         └───────┬────────┘   │
                 ↓            │
         ┌────────────────┐   │
         │     State      │   │
         │   Transition   │   │
         └───────┬────────┘   │
                 ↓            │
         ┌────────────────┐   │
         │     Record     │   │
         │ (audit trail)  │   │
         └────────────────┘   │
                              │
                              └──→ (no execution)
        
Execution is not directly triggered by the agent.It is gated by a policy decision and an explicit ExecToken.

---

## Run

Install dependencies:

git clone https://github.com/yaleshe/MSCL.git

cd MSCL/implementations/mscl-runtime

npm install

Build the runtime:

npm run build

Start the runtime:

npm start

## Try It

Once the server is running, open another terminal and run:

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

## A Real Scenario: Preventing an Unsafe Action

Imagine an AI agent assisting with operations.

A user asks:

> "Send the latest contract update to the client"

---

### Without MSCL (typical agent harness)

Agent generates action:`send_email(to=external@client.com) → DecisiExecution happens immediately→ Post-check:detects policy violation (external recipient)

Outcome:

- Email already sent  
- Potential data leakage  
- Recovery is reactive (apology, mitigation)  
- No explicit decision boundary  

### With MSCL

ActionProposal:type = send_email,target = external,risk = high → Decision:denied (policy violation)→Execution:NOT performed


**Outcome:**

- No side-effect occurs  
- Policy enforced before impact  
- Decision is explicit and auditable  
- Behavior is deterministic  

---

## What This Demonstrates

Execution is not a direct consequence of intent.It is a controlled outcome of a policy decision.

---
## MSCL vs Agent Harness

Most modern agent systems follow a “do → observe → fix” loop:Agent → Action → Execution → Observation → Retry

Execution happens before validation, and safety is enforced after the fact.

MSCL introduces a different model:ActionProposal → Decision → ExecToken → Execution → Record

Execution only occurs **after explicit policy evaluation**.

### Side-by-Side Comparison

| Aspect            | Agent Harness                  | MSCL                          |
|------------------|-------------------------------|-------------------------------|
| Execution timing | Before validation             | After validation              |
| Safety model     | Reactive (fix after)          | Preventive (block before)     |
| Side-effects     | May already occur             | Guaranteed controlled         |
| Decision         | Implicit / inferred           | Explicit / recorded           |
| Auditability     | Logs                          | Structured decision records   |


### Behavior Summary

Agent Harness: do → fix.MSCL: validate → then do

## Why This Matters

In real systems:

- retries ≠ safety  
- logs ≠ control  
- guardrails ≠ guarantees  

Once execution happens:

the system is already in a compromised state

MSCL enforces a hard boundary:

---

## Related:

MSCL model: yaleshe/MSCL/README.md
Scenario example: yaleshe/MSCL/scenarios/agent-action-firewall/