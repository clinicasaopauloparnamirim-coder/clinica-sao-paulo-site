# OpenExecutive MCP Integration Contract

**Status:** adapter implemented in an isolated branch; runtime integration remains disabled and unverified. This document does not claim that OpenExecutive is deployed, reachable, or connected.

## Placement in the architecture

OpenExecutive is an **external advisory council** beneath Control Tower/Nemotron. It is not a tenth brain and does not replace any of the clinic's nine brains or twenty operational agents. Control Tower remains the task owner and execution policy authority; the existing agents remain the execution layer.

## Implemented in this branch

- New client: `control-plane/playwright-mcp/src/openexecutive-mcp.ts`.
- Control Tower MCP tools: `openexecutive_status` and `openexecutive_consult`.
- External-agent registry entry identifies OpenExecutive as `not-runtime-proven`.
- The new tools are protected by the existing authenticated `/mcp/tower` route.
- The feature is disabled unless `OPENEXECUTIVE_ENABLED=true`, an HTTPS `OPENEXECUTIVE_MCP_URL` ending in `/mcp`, and the existing `MCP_AUTH_TOKEN` secret are configured.
- Every MCP request is signed with Ed25519. The Worker derives a signing key from the existing `MCP_AUTH_TOKEN` and exposes only its public key; Railway verifies timestamp, nonce, signature, and body digest before injecting the private `BACKEND_SHARED_SECRET` into the upstream ASGI request. No new Cloudflare secret is required for the caller identity.
- The client requires a valid MCP initialize handshake and sends the same canonical request signature on initialize, tool listing, and the specialist call. It reads `tools/list` and refuses to call the upstream specialist unless `consult_specialist` is explicitly annotated `readOnlyHint=true`.
- Query length, response size, endpoint scheme/path, and timeout are bounded; retries are zero. The adapter rejects common email, CPF, and credential patterns.
- Upstream output is labeled as advisory/untrusted, cannot authorize tools or mutate production, and no secret is returned by status responses.

## Intentionally excluded

Do **not** call `ask_executive` in the initial integration: although it states that it does not send or publish externally, the upstream source records the conversation in episodic memory. Also excluded are workflow execution, email/calendar/WhatsApp integrations, outbound messages, ad spend or campaign changes, publication, deployment, DNS changes, repository mutation, and any destructive action.

In v1, only one upstream operation is exposed: `consult_specialist`. Knowledge search and workflow listing are not called yet because they lack the same explicit `readOnlyHint=true` annotation in the inspected upstream tool definitions. Add capabilities only after re-reviewing the exact upstream revision and annotations.

## Required runtime configuration

Configure these in the deployment's runtime settings, never in committed source:

- `OPENEXECUTIVE_ENABLED`: `true` only after staging approval; absent/false means blocked.
- `OPENEXECUTIVE_MCP_URL`: the HTTPS public MCP endpoint, e.g. `https://openexecutive-api-production-3d98.up.railway.app/mcp`.
- `OPENEXECUTIVE_CALLER_PUBLIC_KEY`: Railway runtime variable containing only the Ed25519 public key returned by `GET /openexecutive/public-key` on the secret-bearing Control Tower Worker. It is public material, not a credential.
- `BACKEND_SHARED_SECRET`: Railway-only secret used by the local ASGI gate to authorize a validated signed request; it is never provided to the caller.

Do not place the `MCP_AUTH_TOKEN`, `BACKEND_SHARED_SECRET`, NVIDIA credential, or the RSA bearer token in source code or logs. The public key endpoint must publish only the public key component. The Railway ASGI gate accepts only `/health` and correctly signed requests to `/mcp` or `/mcp/`; other paths are denied.

## Model and policy boundary

OpenExecutive supports an OpenAI-compatible model gateway through `LOCAL_MODELS_ENABLED`, `LOCAL_BASE_URL`, `LOCAL_API_KEY`, and `LOCAL_MODELS`. A future deployment can route its specialist calls to the clinic-approved NVIDIA Nemotron NIM endpoint, but only after the NIM key is provisioned separately in the upstream service's secret store. The Cloudflare Worker secret inventory confirms that the current Worker has no `OPENEXECUTIVE_*` configuration; secret values were not read or copied.

This integration does not call NVIDIA/Nemotron directly and must not be used to bypass the existing Judge/Red Team/Gauntlet policies. The NVIDIA brain remains gated until its own credential rotation and real inference test pass. An OpenExecutive recommendation is evidence to evaluate, not a final decision or an instruction to execute.

## Acceptance checklist

- [x] Dedicated module created behind a default-off flag.
- [x] Fixed upstream tool name and specialist allowlist; arbitrary tool execution is not supported.
- [x] Endpoint restricted to HTTPS and an `/mcp` path.
- [x] No retry, bounded request timeout and response size.
- [x] Sensitive-pattern rejection for common email, CPF, and credential formats.
- [x] Upstream tool must advertise `readOnlyHint=true`.
- [x] `ask_executive` and other non-verified tools are excluded.
- [x] PR CI typecheck, architecture, and Worker build passed on commit `8922abfea678e6540c4b32913d7a0805d6d84340`.
- [ ] Upstream authenticated handshake and specialist call pass in live runtime.
- [ ] Bad signatures, expired timestamps, duplicate nonces, missing public key, malformed MCP responses, timeout, and unsafe inputs are rejected.
- [ ] A real Nemotron inference succeeds through the authenticated proxy.
- [ ] Redacted evidence is recorded from the deployed Worker and Railway service; no claim of production readiness without the live test.

## Rollout

1. Review PR and CI results.
2. Confirm the intended OpenExecutive instance is clinic-authorized and configured for public deployment with authentication enforced.
3. Deploy the authenticated model gateway and public-key endpoint on the secret-bearing Control Tower Worker.
4. Put the returned public key (not the private token) into Railway runtime configuration and restrict the Railway service to signed `/mcp` requests.
5. Test with a synthetic, non-sensitive query and a low-risk specialist; verify the upstream tool announces `readOnlyHint=true`.
6. Verify blocked behavior for bad signature, expired timestamp, replay, disabled feature flag, timeout, missing public key, and unsafe inputs.
7. Let Judge/Red Team/Gauntlet review live evidence before enabling additional advisory categories.

Until the last acceptance checks have evidence, the status remains **not runtime-proven**.
