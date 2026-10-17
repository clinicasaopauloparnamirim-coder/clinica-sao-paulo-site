# OpenExecutive MCP Integration Contract

**Status:** adapter implemented in an isolated branch; runtime integration remains disabled and unverified. This document does not claim that OpenExecutive is deployed, reachable, or connected.

## Placement in the architecture

OpenExecutive is an **external advisory council** beneath Control Tower/Nemotron. It is not a tenth brain and does not replace any of the clinic's nine brains or twenty operational agents. Control Tower remains the task owner and execution policy authority; the existing agents remain the execution layer.

## Implemented in this branch

- New client: `control-plane/playwright-mcp/src/openexecutive-mcp.ts`.
- Control Tower MCP tools: `openexecutive_status` and `openexecutive_consult`.
- External-agent registry entry identifies OpenExecutive as `not-runtime-proven`.
- The new tools are protected by the existing authenticated `/mcp/tower` route.
- The feature is disabled unless `OPENEXECUTIVE_ENABLED=true` and an HTTPS `OPENEXECUTIVE_MCP_URL` ending in `/mcp` plus `OPENEXECUTIVE_API_KEY` are configured at runtime.
- The client uses the upstream `x-api-key` header and requires a valid MCP initialize handshake. It reads `tools/list` and refuses to call the upstream specialist unless `consult_specialist` is explicitly annotated `readOnlyHint=true`.
- Query length, response size, endpoint scheme/path, and timeout are bounded; retries are zero. The adapter rejects common email, CPF, and credential patterns.
- Upstream output is labeled as advisory/untrusted, cannot authorize tools or mutate production, and no secret is returned by status responses.

## Intentionally excluded

Do **not** call `ask_executive` in the initial integration: although it states that it does not send or publish externally, the upstream source records the conversation in episodic memory. Also excluded are workflow execution, email/calendar/WhatsApp integrations, outbound messages, ad spend or campaign changes, publication, deployment, DNS changes, repository mutation, and any destructive action.

In v1, only one upstream operation is exposed: `consult_specialist`. Knowledge search and workflow listing are not called yet because they lack the same explicit `readOnlyHint=true` annotation in the inspected upstream tool definitions. Add capabilities only after re-reviewing the exact upstream revision and annotations.

## Required runtime configuration

Configure these in the deployment's runtime settings, never in committed source:

- `OPENEXECUTIVE_ENABLED`: `true` only after staging approval; absent/false means blocked.
- `OPENEXECUTIVE_MCP_URL`: the HTTPS public MCP endpoint, e.g. `https://<approved-host>/mcp`.
- `OPENEXECUTIVE_API_KEY`: the upstream `BACKEND_SHARED_SECRET`, stored as a secret.

Do not add the API key to `wrangler.jsonc`, GitHub files, build logs, health snapshots, prompts, or repository issues. The upstream service must be a trusted installation owned or explicitly authorized by the clinic. Its shared secret grants access to the upstream API, so use a dedicated secret and rotate it if exposed.

## Model and policy boundary

This integration does not call NVIDIA/Nemotron directly and must not be used to bypass the existing Judge/Red Team/Gauntlet policies. The NVIDIA brain remains gated until its own credential rotation and real inference test pass. An OpenExecutive recommendation is evidence to evaluate, not a final decision or an instruction to execute.

## Acceptance checklist

- [x] Dedicated module created behind a default-off flag.
- [x] Fixed upstream tool name and specialist allowlist; arbitrary tool execution is not supported.
- [x] Endpoint restricted to HTTPS and an `/mcp` path.
- [x] No retry, bounded request timeout and response size.
- [x] Sensitive-pattern rejection for common email, CPF, and credential formats.
- [x] Upstream tool must advertise `readOnlyHint=true`.
- [x] `ask_executive` and other non-verified tools are excluded.
- [ ] PR CI typecheck and architecture checks pass.
- [ ] Upstream authenticated handshake and specialist call pass in staging.
- [ ] Denied authentication, absent config, malformed MCP response, timeout, and unsafe inputs are tested.
- [ ] Redacted evidence is recorded from the deployed Worker; no production activation before review.

## Rollout

1. Review PR and CI results.
2. Confirm the intended OpenExecutive instance is clinic-authorized and configured for public deployment with authentication enforced.
3. Add runtime configuration through the secure secret/configuration store.
4. Test in staging with synthetic, non-sensitive questions only.
5. Verify blocked behavior when disabled, misconfigured, unauthorized, timed out, or not explicitly read-only.
6. Let Judge/Red Team/Gauntlet review results before enabling a single low-risk advisory category.

Until the last acceptance checks have evidence, the status remains **not runtime-proven**.
