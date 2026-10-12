# CopilotKit coworker ecosystem — integration gate

Status date: 2026-10-12  
Target repository: `clinicasaopauloparnamirim-coder/clinica-sao-paulo-site`  
Decision: **adopt interfaces and staged adapters; do not deploy the upstream templates into the production Worker.**

## Executive decision

The four names in the social post are not four interchangeable libraries:

- **OpenMuse** — self-hosted personal-agent application with mobile/web UI, server-owned jobs, review records, browser worker, and optional isolated Linux computer. Alpha template; it expects its own server/worker/persistence topology.
- **OpenBot** — agent-computer and action-policy platform/template. It is not a reusable package; upstream workspaces are private and integration should use its documented authenticated HTTP/AG-UI boundary.
- **OpenDots** — always-on coworker workspace template, with Spaces/pages, specialist Dots, scheduled turns, optional Slack, and OpenBot-backed computers. It needs its own runtime and storage.
- **OpenTag** — Channels SDK starter application for Slack and Microsoft Teams (not a generic coworker library). WhatsApp is described upstream as coming soon, so it is not a WhatsApp adapter today.

All four are MIT-licensed upstream templates, but that does not make them production-ready plug-ins. OpenMuse/OpenDots/OpenTag use CopilotKit Intelligence in their documented default setup; verify the self-hosted alternative and provider costs before selecting one. Do not put these apps inside the existing Cloudflare Worker entrypoint.

## Existing system facts verified from this repository

- Root `package.json` names the project `clinica-sao-paulo-site`; it deploys with Wrangler and includes Cloudflare Agents, AI provider, and Playwright MCP.
- `wrangler.jsonc` declares the Worker entrypoint `control-plane/playwright-mcp/src/index.ts`, AI and Browser bindings, and Durable Objects for `WhatsAppLedger`, `PlaywrightMCP`, `ControlAgent`, and `GoogleOAuthStore`.
- The main entrypoint file was returned by GitHub connector as `SEE_LOCAL`; its implementation could not be independently inspected through this connector response. Therefore this document does **not** claim a code-level runtime integration, deployed route, or successful live round trip.

## Target architecture

```text
Clinic Control Tower (existing Cloudflare Worker)
  ├─ GAUNTLET policy / authorization / evidence ledger (authority)
  ├─ existing Google Ads / GA4 / GSC / WhatsApp / MCP tool adapters
  └─ Coworker Gateway (new, server-side only; disabled until configured)
       ├─ OpenMuse adapter (optional task UI + reviewed long-running work)
       ├─ OpenBot adapter (optional isolated computer; authenticated HTTP/AG-UI)
       ├─ OpenDots adapter (optional specialist workspace / scheduled turns)
       └─ OpenTag adapter (optional Slack/Teams channel ingress)
```

The gateway is an adapter boundary, not a second source of truth. GAUNTLET remains the authority for capability allowlists, policy decisions, approvals, idempotency, read-back verification, and evidence. A coworker may propose an action; it cannot bypass authorization or directly receive production secrets.

## Non-negotiable security and compatibility rules

1. Feature flags default off. Missing, invalid, or unreachable upstreams return explicit `unavailable`; never fake success or silently fall back to fixtures.
2. Keep upstream tokens and model keys in server-side secrets only. Never place them in browser/mobile bundles, Git, logs, prompts, or public Worker variables.
3. Use HTTPS outside local development; validate destination hosts to prevent SSRF. No arbitrary URL navigation, shell, filesystem, or browser-control access from public endpoints.
4. Every mutation needs a policy decision, a durable approval record where required, idempotency/replay protection, and post-action read-back. Ambiguous writes are marked `uncertain`, not blindly retried.
5. Keep each end-user identity distinct. Do not use OpenBot's single-user mode or a shared admin session for production.
6. Do not connect OpenTag to WhatsApp yet: upstream currently documents Slack and Microsoft Teams support; WhatsApp is not a supported production channel in that starter.
7. Do not deploy upstream apps as Worker bundles. Their documented topologies include separate Node/Python services, workers, persistent storage, browser/computer services, and in some cases Docker; Cloudflare Worker runtime is not a drop-in host for those stacks.
8. No Google Ads budget changes, patient messaging, CRM writes, or other external side effects without explicit scoped authorization and audit receipts.

## Integration phases and acceptance gates

### Phase 0 — evidence and scope (this document)
- Record upstream product boundaries and existing Worker bindings.
- Status: documented in this branch; not a runtime integration.

### Phase 1 — gateway contract (next code change)
- Add typed adapter contract: `health()`, `capabilities()`, `propose()`, `executeApproved()`, `readBack()`.
- Add server-side feature flags and strict schemas for provider URLs, agent IDs, capabilities, timeout, and response size.
- Add `GET /api/coworkers/health` returning configured/unconfigured/unavailable without leaking secret values.
- Unit-test missing secret, invalid host, auth rejection, timeout, malformed response, policy refusal, duplicate idempotency key, and failed read-back.
- No provider enabled by default.

### Phase 2 — choose one pilot, not four deployments
- Preferred first pilot: **OpenMuse as an isolated task/review UI**, only if a separate host/runtime can be operated and secured. It offers persistent jobs and reviewed actions that fit the GAUNTLET evidence workflow.
- OpenBot is a later computer backend only if real browser/terminal isolation is needed; use its authenticated server gateway, not direct computer/supervisor ports.
- OpenDots is an alternative workspace, not something to run alongside OpenMuse before a concrete need is demonstrated.
- OpenTag is a channel ingress only if Slack/Teams becomes an explicit operational requirement; it does not solve WhatsApp integration.
- Compare resource cost, secrets, identity, retention, and maintenance before approving a pilot.

### Phase 3 — staging round-trip and production gate
A pilot is not integrated until all of these pass against a real staging deployment:
- authenticated health and capability discovery;
- user identity isolation and permission-denied cases;
- task start, cancellation, restart/recovery, and duplicate delivery;
- approval pause/resume for a mutation;
- successful read-back from the actual destination;
- logs/evidence with redacted secrets and correlation IDs;
- typecheck, tests, build, and deployment health check;
- rollback path verified.
Only then may the feature flag be enabled in production.

## GAUNTLET Loop record

- **Search:** inspected CopilotKit OpenMuse, OpenBot, OpenDots, and OpenTag public repository descriptions/docs.
- **Confront:** compared their documented runtime boundaries with the current Cloudflare Worker manifest.
- **Test:** repository metadata/config was fetched; the main TypeScript entrypoint could not be inspected in the connector result (`SEE_LOCAL`). No live provider was contacted.
- **Classification:** architecture fit = conditional; production integration = **not proven**; deployment = **not performed**.
- **Decision:** add no upstream dependency and no production secret in this change. Build a minimal gated gateway, then pilot one isolated app only after tests and hosting are available.
- **Repeat trigger:** continue the loop when the entrypoint source is accessible or a concrete staging host/runtime and credentials are configured.

## Upstream references

- OpenMuse: https://github.com/CopilotKit/openmuse
- OpenBot: https://github.com/CopilotKit/OpenBot
- OpenDots: https://github.com/CopilotKit/OpenDots
- OpenTag: https://github.com/CopilotKit/OpenTag
- OpenMuse/OpenBot boundary notes: https://github.com/CopilotKit/openmuse/blob/main/docs/OPENBOT-INTEGRATION.md

## Explicit status

This file is a reviewed integration design and decision record. It does **not** mean OpenMuse, OpenBot, OpenDots, or OpenTag has been installed, authenticated, deployed, or connected to production. Those claims require the Phase 2/3 evidence above.


## Follow-up live infrastructure audit — 2026-10-12

Cloudflare API was queried through the authorized connection after the first draft was written:

- Account contains three Workers: `clinica-sao-paulo-site`, `jev-control-tower`, and `weathered-tree-2839`.
- `jev-control-tower` is still the stock `Hello World!` Worker. Its reported Google OAuth bindings are empty plain-text values. It is not a viable deployment target for a coworker app or the control plane.
- `clinica-sao-paulo-site` has the current production bindings, including Composio, Google OAuth, MCP, WhatsApp, and Durable Objects. Its deployment history shows repeated production deployments on October 12. This makes an unverified direct mutation of its Worker code an unacceptable risk.
- `weathered-tree-2839` has agent-related Durable Object bindings but no demonstrated provider credentials or successful health/round-trip evidence. It is not approved as a production host.
- The production Worker's binding inventory did not include `CPK_INTELLIGENCE_API_KEY`, `INTELLIGENCE_API_KEY`, or OpenBot's managed agent token. This inventory reveals binding names/types, not secret values; no secret values were read.
- No successful GitHub Actions workflow run was returned for the documentation commit. No build, live provider health check, or end-to-end coworker round-trip has passed.

### Deployment decision after live audit

**Deploy none of the four upstream applications at this time.** This is a deliberate safety decision, not a claim that the projects cannot ever run:

- OpenMuse is the most promising pilot, but requires its own app/server/browser-worker/persistence topology and a configured Intelligence project key.
- OpenBot requires a separate supported runtime and managed credentials; it is not a Cloudflare Worker library.
- OpenDots requires its own runtime/storage and Intelligence connection, overlapping the proposed OpenMuse pilot.
- OpenTag requires separate Node/Python services, a configured Intelligence/Channels path and channel credentials; it does not provide WhatsApp Business support.

No code was pushed to the production branch, no production Worker was changed, no secret was created or exposed, and no upstream service was falsely marked healthy. The next allowed action is to provision/configure a separate supported staging runtime and credentials, then run the acceptance tests. Only OpenMuse should be evaluated first; the other three remain excluded unless the pilot demonstrates a specific unmet requirement.
