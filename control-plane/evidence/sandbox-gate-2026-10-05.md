# Sandbox Gate Evidence — 2026-10-05

## Scope

First operational gate for AgentJev (JEV), using only disposable/local execution checks and public repository source. No production credentials, no production repository mutation, no merge to `main`.

## Environment evidence

Direct runner inspection:

- git: available (`git version 2.47.3`)
- Python: available (`3.13.5`)
- Node: available (`v22.16.0`)
- Docker: unavailable
- Podman: unavailable
- GitHub network resolution from runner: unavailable (`Could not resolve host: github.com`)
- Installed Python packages: torch `2.10.0+cpu`, numpy `2.3.5`, PyYAML `6.0.3`, requests `2.32.5`; transformers is not installed.

## Static contract review

Repository: `malevrigns/agent-jev`

Reviewed:

- `agentjev_client.py`
- `jev_service/contract.py`
- `jev_service/server.py`
- `agentjev_hook.py`

Static contract result: **PASS**

Directly verified:

- API endpoint is loopback by default: `127.0.0.1:8149`.
- API contract exposes boolean, choice and score decisions.
- Batch limits are explicitly validated in `contract.py`.
- Candidate descriptions are required to be distinct.
- Over-limit token input is rejected rather than silently truncated.
- Server exposes `/health`, `/api/info`, and `/api/evaluate`.

## Security-gate review

Security-control result: **FAIL for adoption as a Control Tower safety barrier**

Finding 1 — fail-open behavior:

`agentjev_hook.py` catches inference/network exceptions and exits with status 0. Therefore an unavailable, broken, or timed-out AgentJev service allows the protected Bash/Write/Edit action to proceed.

Finding 2 — sensitive action logging risk:

For Bash, the hook copies the first 400 characters of `tool_input.command` into `action_summary`, then writes up to 120 characters into `agentjev_guard.log`. A shell command can contain credentials, tokens, headers, URLs with secrets, or other sensitive values. The current hook does not redact them.

Finding 3 — model output is advisory, not an independent authorization layer:

The hook blocks only when AgentJev returns risk level 3 AND unsafe. This means the model is directly in the authorization path, while the failure path is permissive.

## Runtime gate

Runtime model execution: **BLOCKED**

Reason: the current runner cannot provide the repository/model dependencies or network needed to install/fetch them, and no Docker/Podman sandbox is available.

This is not evidence that AgentJev itself fails. It is evidence that this execution environment cannot currently perform the required sandbox test.

## Verdict

- Identity: PASS (previous gate)
- Static interface: PASS
- Security-gate design: FAIL
- Real model sandbox execution: BLOCKED
- Production approval: NO-GO

## Required remediation before adoption

1. Change safety-hook failure mode from fail-open to fail-closed for protected operations, or explicitly remove the hook from the security boundary and classify it as advisory telemetry.
2. Redact secrets/sensitive command material before logging; preferably log only tool type, risk class, request hash, timestamp, and decision metadata.
3. Add deterministic policy checks independent of the model for destructive commands, credential access, force pushes, production endpoints, and secret files.
4. Re-run the sandbox test in an environment with an isolated runtime and pinned model artifacts.
5. Require repeated PASS results before granting any production write permission.

## Confidence

High for the static findings because they are directly visible in repository source. Runtime capability remains BLOCKED by the current execution environment.
