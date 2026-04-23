# Agent Action Firewall

A scenario example built on top of the MSCL runtime.

---

## What This Shows

An AI agent wants to act.

This system decides whether that action is allowed before execution.

Without a control layer:

`Agent → Action → Execution`

With MSCL:

`Agent → ActionProposal → Decision → Execution`

---

## The Scenario

The example action is:

`send_email`

The system evaluates whether the action should be allowed based on:

- target (internal vs external)  
- risk level  
- policy rules  

---

## Example Outcomes

Allowed:
send_email(to=internal) → Decision: ALLOW → executed
Blocked:
send_email(to=external, contains_sensitive_data) → Decision: DENY → blocked
No control layer:
send_email(...) → executed directly

---

## Why This Matters

Most agent systems today follow:

`do → fix`

This scenario demonstrates:

`validate → then do`

The key idea is introducing a control boundary between intent and execution.

---

## How It Connects to MSCL

This scenario is built on the MSCL runtime:

- proposals are structured  
- decisions are explicit  
- execution is gated  
- results are recorded  

The firewall is just one example.

The underlying control model is domain-independent.

---

## Try It

See runtime:yaleshe/MSCL/implementations/mscl-runtime/

---

The agent wants to act.  This layer decides if it actually can.
