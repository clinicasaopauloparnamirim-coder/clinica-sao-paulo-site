# NVIDIA Ecosystem Brain — Operating Protocol

Brain: 09
Status: ACTIVE-CANDIDATE
Owner layer: Control Plane
Access class: Research / Audit / Governance

## Operating rule

Brain 09 investigates NVIDIA broadly and independently, but it does not own the production path.

## Canonical flow

NVIDIA GitHub universe
→ discovery
→ candidate normalization
→ forensic audit
→ GAUNTLET LOOP
→ architecture fit
→ security/license gate
→ integration test
→ promotion decision
→ registry / evidence

## Candidate scoring

Score 0–10 for:
- strategic fit
- orchestration value
- research value
- engineering value
- security value
- observability value
- integration quality
- project activity
- license compatibility
- operational cost/risk

Final status must explain both value and blockers.

## Required evidence

At minimum:
- official repository identity
- current default branch / release state
- recent activity
- license
- README / architecture evidence
- dependency surface
- test / CI evidence
- security policy where available
- integration interfaces
- relationship to existing project candidates

## Promotion rules

APPROVE:
Evidence is strong and no critical blocker exists.

INTEGRATION-TEST:
Strong fit, but runtime/dependency/security or overlap needs a contained test.

DEFER:
Potential value but timing, maturity or cost is unfavorable.

DUPLICATE:
Existing component already provides the capability with equal or better fit.

REJECT:
Poor fit, abandoned, unsafe, incompatible or unnecessary.

## Installation discipline

Brain 09 can recommend installation but must not silently install into production.
Any sandboxed test must:
- run outside the money-path,
- use no clinical secrets,
- preserve audit evidence,
- be reversible.

## Interaction with RED TEAM/JUDGE

Brain 09 sends all candidate skills, MCP extensions and agent artifacts through the skill/security gate before promotion.

Preferred sequence:
SkillSpector
→ SkillEvaluator
→ runtime test
→ Judge decision.

## Interaction with Control Tower

Brain 09 may read Control Plane architecture and registries.
Brain 09 must not mutate Ads, analytics or production website state.

## Interaction with 8 brains

A candidate is assigned to an existing brain or shared infrastructure.
No candidate can create Brain 10 merely because it is NVIDIA-specific.

## Initial execution queue

P0:
OpenShell, NemoClaw, NeMo-Agent-Toolkit, NeMo-Relay, NVIDIA/skills, SkillSpector, SkillEvaluator.

P1:
NeMo-Retriever, context-aware-rag, garak, TensorRT-LLM, ToolOrchestra, SoL-Pi, Skill2Env, Nemotron.

P2:
UniversalDeepResearch, KDA, RAFT and other specialized projects.

## Exit condition

The audit is not considered complete until all material NVIDIA candidates discovered by search are either:
- classified and recorded,
- merged into an equivalent candidate,
- deferred with reason,
- rejected with reason,
- or placed in a defined future queue.
