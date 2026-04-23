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

## 5. Scope

MSCL is not a framework or product.

It does not define:

- UI/UX patterns  
- model architectures  
- specific policy languages  
- infrastructure choices  

Instead, it defines a minimal set of semantic relationships and constraints that implementations may adopt.

---

## 6. Structure

This repository is organized as follows:

- `spec/` — core object model and semantics  
- `conformance/` — compatibility levels and requirements  
- `examples/` — minimal representations and scenarios  
- `implementations/` — reference implementations  

---

## 7. Implementations

- `agent-action-firewall` — a minimal reference implementation demonstrating action interception and control before execution  

---

## 8. Conformance

MSCL defines compatibility in terms of observable behavior, not implementation details.

An implementation MAY claim MSCL compatibility if it:

- represents actions as explicit proposals  
- evaluates them against policy before execution  
- enforces an authorization boundary  
- maintains traceability across execution  

See `conformance/` for formal definitions.

---

## 9. Origin

MSCL was initiated by [Yale Shen].

It is developed in the open as an exploration of how AI systems can safely execute real-world actions.