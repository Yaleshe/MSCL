# MSCL — Minimal Semantic Control Loop

A minimal control layer for governing AI actions before they execute.

Most agent systems do:`Agent → Action → Execution`

MSCL introduces an explicit control boundary:`ActionProposal → Decision → Execution`

No side-effect occurs without a policy-bound decision.

---

## Repository Structure

This repository is organized into three layers:

### 1. Model

The root README, `docs/`, `spec/`, and `conformance/` define the MSCL model:

- positioning
- control loop
- invariants
- conformance expectations

### 2. Reference Runtime

`implementations/mscl-runtime/` contains a TypeScript reference implementation of the MSCL execution kernel.This is the invariant control layer behind all scenarios.

### 3. Scenario Examples

`scenarios/` contains domain scenarios built on top of the runtime.Current example:

- `scenarios/agent-action-firewall/`

---

## Where to Start

- Want to understand the idea → start from this README  
- Want to run the system → go to `implementations/mscl-runtime/`  
- Want to see a concrete example → go to `scenarios/agent-action-firewall/`

---

## 1. Overview

MSCL (Minimal Semantic Control Loop) defines a minimal semantic model for governing AI-driven actions.

It introduces a control loop that separates:

- action proposal  
- decision  
- authorization  
- execution  

into an explicit, enforceable, and auditable structure.

MSCL is not tied to a specific implementation, model, or domain.  
It is intended as a minimal contract that can be applied across systems.

---

## 2. Problem

Modern AI systems are increasingly capable of taking real-world actions:

- sending external communications  
- modifying production systems  
- accessing or transforming sensitive data  

In many implementations, the boundary between reasoning and execution is implicit or absent.

This results in systems where:

- actions are executed directly from model output  
- policy exists but is not strictly enforced  
- side-effects occur without explicit authorization  

Such systems are difficult to reason about, audit, or control.

---

## 3. Model

MSCL defines a minimal control loop:
ActionProposal → Decision → ExecToken → Execution → State → Record

Where:

- actions are first represented as explicit **ActionProposals**  
- policies produce a deterministic **Decision**  
- execution requires an explicit **authorization boundary**  
- all outcomes are recorded and made observable  

This structure separates intent from execution and makes control explicit.

---

## 4. Positioning

MSCL is not:

- a prompt technique  
- a guardrail wrapper  
- a logging or monitoring system  

MSCL is:

> **a control layer between AI-generated intent and real-world execution**

More generally:

> **a minimal execution kernel that sits beneath any domain-specific semantic layer**

It separates:

- what is proposed  
- what is allowed  
- what is executed  

making the boundary between reasoning and side-effects explicit, enforceable, and auditable.

This positioning becomes more relevant as systems move from suggestion to real-world execution.

---

## 5. Stable Kernel, Evolving Semantics

MSCL is designed as an invariant execution control layer.

The core control loop remains stable across domains:

ActionProposal → Decision → ExecToken → Execution → State → Record

---

What evolves is the semantic layer built on top:

- new action types  
- richer normalization rules  
- reusable policy patterns  
- domain abstractions  

---

Over time, these accumulate into a shared semantic layer.

Each scenario contributes structure that improves the system globally.

This is how the system scales.

---

## 6. Open Semantic Layer (Ecosystem)

The long-term goal of MSCL is to enable an open, shared semantic layer:

- where action types, normalization rules, and policy patterns can be contributed  
- where domains build on top of a common execution model  
- where improvements in one scenario benefit others  

This allows the ecosystem to evolve collectively, rather than as isolated implementations.

---

## 7. Architectural Inspiration

This model is inspired by a broader architectural pattern:

- a stable execution/control kernel  
- a domain-specific semantic layer built on top  

Similar ideas can be observed in platforms such as Palantir’s ontology and AIP systems,  
where a consistent underlying execution model is combined with domain-specific abstractions.

MSCL generalizes this pattern into a minimal, open control model:

- the kernel remains invariant  
- semantics evolve through use  
- domains project their logic onto a shared execution substrate  
  
## 8. Value of the Approach

This approach provides several practical advantages:

### 1. Preventive Control over Reactive Fixes

By enforcing a decision boundary before execution:

- unsafe actions are blocked before side-effects occur  
- systems avoid relying on retries, rollbacks, or post-hoc mitigation  

---

### 2. Deterministic and Auditable Behavior

Every action follows an explicit control path:

ActionProposal → Decision → ExecToken → Execution → Record

- decisions are visible and explainable  
- execution is traceable  
- behavior can be replayed and verified  

---

### 3. Separation of Concerns

MSCL separates:

- intent (what is proposed)  
- policy (what is allowed)  
- execution (what actually happens)  

This makes systems easier to reason about and evolve independently.

---

### 4. Composable Across Domains

Because the kernel is invariant:

- different domains can reuse the same execution control model  
- domain-specific semantics can evolve without changing the core  
- improvements in one domain can inform others  

---

### 5. Community-Driven Semantic Growth

An open semantic layer enables:

- shared action definitions and normalization patterns  
- reusable policy structures  
- cross-domain learning and accumulation  

Over time, this creates a compounding effect:the system becomes more structured and more reusable as more scenarios are built.

## 9. Who Should Care

MSCL is relevant to anyone building systems where AI-generated intent can lead to real-world actions.

---

### Developers building AI agents

- You want to prevent unsafe or unintended side-effects  
- You need a clear boundary between model output and execution  
- You are struggling with “agent did something I didn’t ask”  

MSCL provides a deterministic control layer between intent and execution.

---

### Platform and infrastructure engineers

- You are designing systems that integrate AI with production services  
- You need enforceable policy boundaries across multiple domains  
- You care about auditability, traceability, and system correctness  

MSCL provides a minimal execution kernel that can be reused across services.

---

### Enterprise and compliance teams

- You need to ensure actions are policy-compliant before execution  
- You require audit trails and explainability  
- You cannot rely on probabilistic behavior for critical operations  

MSCL makes decisions explicit and enforceable before impact occurs.

---

### Builders of domain-specific AI systems

- You are modeling workflows (finance, healthcare, operations, etc.)  
- You need domain semantics on top of a consistent execution model  
- You want reuse across scenarios without redefining control logic  

MSCL enables domain semantics to evolve on top of a stable kernel.

---

In short

MSCL is for systems that move from: AI suggesting actions to AI executing actions in the real world
At that boundary, control becomes a first-class concern.

---

## 10. Get Involved

This project is evolving.

If you are building systems where AI actions must be controlled:

- share your use cases  
- contribute scenarios or policy patterns  
- help shape the open semantic layer  

Discussions, feedback, and contributions are welcome.

### Collaboration

MSCL is intended as an open control model.

If you are:

- exploring enterprise adoption  
- interested in co-developing domain scenarios  
- working on platforms that require controlled AI execution  

we welcome collaboration and discussion.

## 11 . Scope

MSCL is not a framework or product.

It does not define:

- UI/UX patterns  
- model architectures  
- specific policy languages  
- infrastructure choices  

Instead, it defines a minimal set of semantic relationships and constraints that implementations may adopt.

---

## 12. Structure

This repository is organized as follows:

- `spec/` — core object model and semantics  
- `conformance/` — compatibility levels and requirements  
- `examples/` — minimal representations and scenarios  
- `implementations/` — reference implementations  

---

## 13. Implementations

- `mscl-runtime` — a minimal reference implementation demonstrating action interception and control before execution  

---

## 14. Conformance

MSCL defines compatibility in terms of observable behavior, not implementation details.

An implementation MAY claim MSCL compatibility if it:

- represents actions as explicit proposals  
- evaluates them against policy before execution  
- enforces an authorization boundary  
- maintains traceability across execution  

See `conformance/` for formal definitions.

---

## 15. Origin

MSCL was initiated by [Yale Shen].

It is developed in the open as an exploration of how AI systems can safely execute real-world actions.