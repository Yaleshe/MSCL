# Agent Action Firewall

A domain scenario demonstrating how MSCL governs email actions before execution.

---

## Scenario

An AI agent attempts to send an email.

The system evaluates whether the action is allowed based on:

- target (internal vs external)  
- risk level  
- policy rules  

---

## Policy Example

- Internal email → allowed  
- External email → requires approval  
- External + sensitive content → denied  

---

## Example Outcomes

### Allowed

send_email(to=internal)→ APPROVED → executed

---

### Blocked

send_email(to=external, contains_sensitive_data)→ DENIED → not executed

---

## What This Scenario Demonstrates

This scenario shows how MSCL applies a control boundary:ActionProposal → Decision → Execution


Execution only occurs when explicitly allowed.

---

## How to Run

See runtime:implementations/mscl-runtime/

Then test:
```
curl -X POST http://127.0.0.1:8787/proposals \
  -H "Content-Type: application/json" \
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
```

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
