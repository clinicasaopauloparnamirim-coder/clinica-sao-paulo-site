# OpenExecutive MCP Integration Contract

Status: design only. This document does not assert that the service is deployed, connected, or tested.

## Architecture placement
OpenExecutive is an advisory executive council beneath Control Tower/Nemotron, not a new top-level brain. Nemotron owns task planning, delegation, final decisions, and verification. Existing operational agents remain the execution layer; do not create duplicate agents.

## Initial scope
Start read-only. Use only the documented MCP tools for executive questions, specialist consultation, knowledge search, and workflow catalog listing. An advisory response is not permission to execute external actions.

## Required controls
- One task owner: Control Tower/Nemotron. No recursive agent delegation.
- Unique task ID, bounded timeout, retry cap, model-call limit, and deduplication.
- Record source references, selected specialist, recommendation, assumptions, uncertainty, verifier verdict, and final disposition.
- Never pass credentials, tokens, or identifiable dental/patient data to the council.
- No spending, ad changes, outbound messages, publication, deployment, DNS, repository mutation, or destructive operation without the relevant explicit approval.
- Keep credentials in runtime secret storage; never commit them.
- Internet-facing deployment must use TLS and documented authentication; fail closed if authentication is not configured.
- If the council is unavailable or evidence is insufficient, return BLOCKED; do not silently trigger a write-capable fallback.

## Compatibility gate
Do not assume the Nemotron endpoint works with OpenExecutive. In staging, test the exact model/provider for tool calling, structured output, latency, failure behavior, and cost before routing live work.

## Acceptance checklist
- [ ] Authentication failure is denied.
- [ ] Read-only MCP catalog and specialist consultation work.
- [ ] Invalid specialist and malformed response are rejected.
- [ ] Timeouts and call limits stop runaway work.
- [ ] Repeated task IDs do not duplicate downstream work.
- [ ] Recommendations cannot trigger external writes by themselves.
- [ ] Judge/Red Team/Gauntlet can block unsupported conclusions.
- [ ] Audit records provenance without sensitive content.
- [ ] Control Tower continues safely when OpenExecutive is offline.
- [ ] Exact intended model/provider passes staging tests.

## Rollout
1. Review the exact upstream revision and deployment.
2. Configure authenticated endpoint through runtime secrets.
3. Run read-only smoke tests in staging.
4. Run the acceptance checklist and inspect redacted logs.
5. Enable one low-risk advisory category.
6. Expand only after evidence-based verification.

No integration is considered active until the checklist has real test results.