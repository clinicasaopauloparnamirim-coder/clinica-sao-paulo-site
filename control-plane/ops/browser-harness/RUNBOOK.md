# Browser Harness Operational Runbook

## Preflight

Run in the Browser Harness checkout:

```bash
./browser-harness --doctor
```

For installed usage:

```bash
browser-harness --doctor
```

Do not proceed if the exact browser worker is unhealthy.

## Install / upgrade

Use the upstream documented installation path and pin/record the tested
version before changing production automation.

Current audit baseline: upstream package version observed as `0.1.13`.

After an upgrade:

1. run unit tests;
2. run doctor;
3. run a read-only smoke test;
4. verify MCP startup if MCP is enabled;
5. run the Control Tower browser contract tests;
6. only then promote the version.

## MCP

The upstream package exposes:

```text
browser-harness-mcp
```

MCP clients must connect to an isolated browser worker. Do not expose the MCP
server as an unrestricted public endpoint.

## Smoke test

Minimum smoke:

```bash
browser-harness <<'PY'
print(page_info())
PY
```

Then verify navigation and observation in a disposable browser session.

## Recording

Default:

```bash
browser-harness recordings disable
```

Enable only for an explicitly justified run.

## Telemetry

Controlled environments should disable upstream anonymous telemetry:

```bash
browser-harness telemetry disable
```

## Incident response

If a browser job behaves unexpectedly:

1. stop the job;
2. do not retry blindly;
3. capture the last verified state;
4. preserve relevant evidence;
5. invalidate the worker if session contamination is suspected;
6. rotate credentials if secrets may have been exposed;
7. record the failure in the audit log;
8. reproduce in an isolated worker before restoring writes.

## Production promotion gate

A Browser Harness workflow is production-ready only when:

- target is deterministic;
- policy is explicit;
- browser is isolated;
- post-condition is defined;
- verification succeeds;
- evidence is retained appropriately;
- failure behavior is deterministic;
- concurrency is controlled;
- secrets never enter source control.
