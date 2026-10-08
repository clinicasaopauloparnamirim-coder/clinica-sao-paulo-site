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
