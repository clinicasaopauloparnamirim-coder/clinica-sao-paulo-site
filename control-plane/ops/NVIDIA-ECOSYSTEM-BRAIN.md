# Brain 09 — NVIDIA Ready-for-Use Protocol

## Operating state

Brain 09 is ready to receive NVIDIA candidates and route them through the Control Plane. "Ready-for-use" does not mean every NVIDIA repository is installed.

## P0 execution queue

1. SkillSpector — security gate.
2. SkillEvaluator — efficacy gate.
3. OpenShell — sandbox/runtime test.
4. NeMo Relay — runtime/observability test.
5. NeMo Agent Toolkit — orchestration test.
6. ToolOrchestra — routing experiment.

## P1 queue

NeMo Retriever, Context-Aware RAG, garak, SoL-Pi, Skill2Env, TensorRT-LLM, Nemotron.

## P2 queue

UniversalDeepResearch, KDA and specialized NVIDIA research projects.

## Promotion contract

A repository can move from integration-test to approved only after:
- identity is verified;
- license is recorded;
- dependencies are known;
- security scan passes;
- isolated runtime test succeeds;
- overlap is documented;
- target brain is explicit;
- rollback path exists.

## No silent promotion

Brain 09 never silently installs or grants production access. Production promotion remains under Control Tower governance.

## First practical stack

The intended first stack is:

Brain 09
-> SkillSpector
-> SkillEvaluator
-> OpenShell
-> NeMo Relay
-> selected agent/tool
-> evidence
-> Judge
-> promotion

This keeps the NVIDIA ecosystem modular and prevents a second competing Control Tower.


## GAUNTLET evidence — 2026-10-08

Static forensic pass completed for the P0 queue.

- OpenShell: identity/license/CI/security-policy evidence PASS; runtime NOT EXECUTED here.
- NemoClaw: identity/license/code-scanning/compatibility workflow evidence PASS; runtime NOT EXECUTED; alpha gate remains.
- NeMo Agent Toolkit: identity/license/CI evidence PASS; runtime NOT EXECUTED.
- NeMo Relay: identity/license/multi-language CI/license-diff evidence PASS; runtime NOT EXECUTED.
- NVIDIA/skills: official catalog identity PASS; every individual skill remains subject to SkillSpector.
- SkillSpector: identity/license/CI/Scorecard/release evidence PASS; local execution NOT EXECUTED here.
- SkillEvaluator: identity/license/CI/security workflow evidence PASS; live tier evaluation NOT EXECUTED here.
- ToolOrchestra: project identity and orchestration artifacts verified; isolated model/runtime experiment NOT EXECUTED here.

### Runtime truth

The connected environment available to this Control Plane session does not provide a supported isolated Linux/Docker/GPU runtime for executing arbitrary NVIDIA runtimes. Therefore no component is falsely promoted to production.

Runtime gate sequence:
1. SkillSpector
2. SkillEvaluator Tier 1/2
3. OpenShell sandbox smoke test
4. NeMo Relay telemetry/trajectory test
5. NeMo Agent Toolkit minimal agent
6. ToolOrchestra isolated routing
7. NemoClaw only after OpenShell passes

Static evidence = AUDITED.
Runtime evidence = INTEGRATION-APPROVED.
Production evidence = PROMOTED.
