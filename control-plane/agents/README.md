# Agents

This directory tracks agent roles, capabilities, permissions and verification results.

## Current candidates

- Brain 09 — NVIDIA Ecosystem Intelligence — dedicated NVIDIA discovery, forensic audit, security/license review and controlled promotion layer.
- Hermes Agent — candidate autonomous execution layer.
- Composio — candidate integration/auth/tool layer.

## Permission model

1. Read-only discovery.
2. Read-only test with evidence.
3. Sandboxed write test.
4. Scoped production write.
5. Expanded permissions only after repeated verification.

No agent receives unrestricted production access by default.
