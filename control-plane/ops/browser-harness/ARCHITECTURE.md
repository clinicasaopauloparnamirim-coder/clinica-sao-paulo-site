# Browser Harness — Control Tower Architecture

## Components

### Control Tower

Plans, reasons, routes, audits, and owns policy.

### Browser Gateway

A narrow adapter between the Tower and Browser Harness. It should expose
high-level operations rather than arbitrary CDP to normal agents.

### Policy Gate

Rejects jobs that violate mode, domain, credential, concurrency, or mutation
rules.

### Browser Queue

Provides a lease so two agents cannot accidentally manipulate the same mutable
browser state simultaneously.

### Browser Harness

Executes browser interactions through CDP and exposes the browser-harness MCP
surface when configured.

### Evidence Store

Stores screenshots, page state, assertion results, and structured job metadata
with retention controls.

## Data flow

```
agent
  |
  v
Control Tower
  |
  +--> Policy Gate --------X--> rejected job
  |
  v
Browser Queue
  |
  v
Browser Gateway
  |
  v
Browser Harness
  |
  v
isolated Chrome
  |
  +--> observation
  +--> evidence
  |
  v
assertion
  |
  v
audit result
```

## Capability model

The gateway should expose capabilities such as:

- `browser.inspect`
- `browser.navigate`
- `browser.screenshot`
- `browser.extract`
- `browser.verify`
- `browser.fill`
- `browser.click`
- `browser.submit`

Capabilities above `browser.verify` should be policy-controlled. Arbitrary
`browser_cdp` and unrestricted JavaScript should remain privileged operations.

## Verification contract

Every mutating job must define:

```yaml
expected:
  type: observable_state
  condition: "..."
evidence:
  required: true
```

The executor reports:

```yaml
status: success | failed | blocked
verified: true | false
evidence: [...]
```

A `success` status with `verified: false` is invalid.

## Browser lifecycle

- Reuse a healthy worker when the task is sequential and isolated.
- Do not create a new local daemon merely because an agent exists.
- Use separate remote browsers for genuine concurrency.
- Close temporary tabs created by a job unless a follow-up explicitly needs them.
- Never foreground the browser merely to make an automation work.

## Failure domains

```
Policy failure       -> blocked
Browser unavailable  -> infrastructure failure
Navigation failure   -> execution failure
Unexpected UI        -> verification failure
Post-condition fail  -> task failure
```

These must remain distinguishable in audit logs.
