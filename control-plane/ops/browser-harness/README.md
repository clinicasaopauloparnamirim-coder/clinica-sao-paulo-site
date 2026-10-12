# Browser Harness — Control Plane Integration

## Purpose

Browser Harness is an execution worker for real-browser verification and browser
automation. It is **not** the Control Tower brain, policy authority, or source of
truth.

The integration follows:

```
Control Tower
  -> policy gate
  -> browser queue / lease
  -> Browser Harness worker
  -> isolated Chrome session
  -> action
  -> observation
  -> assertion
  -> evidence
  -> audit log
```

## Initial operating mode

- Default: **READ_ONLY**
- Production mutations: disabled until explicitly enabled by policy.
- Destructive or irreversible actions: confirmation/policy gate required.
- Local Chrome with personal sessions: prohibited for Tower jobs.
- Cloud/isolated browser: preferred for parallel or sensitive jobs.
- Recordings: OFF by default.
- Browser Harness telemetry: OFF for controlled environments.
- Search-2: out of scope and must not be reintroduced by this integration.

## Upstream

- Repository: https://github.com/browser-use/browser-harness
- MCP server: `browser-harness-mcp`
- Local command: `browser-harness`

The upstream project is currently Alpha. Treat it as an executor dependency,
not a trusted control-plane authority.

## Job lifecycle

1. Validate target and requested capability.
2. Acquire a browser-worker lease.
3. Enforce policy.
4. Attach/open the isolated browser session.
5. Execute the smallest necessary action.
6. Observe the resulting state.
7. Assert the expected outcome.
8. Persist evidence and audit metadata.
9. Release the browser lease.
10. Mark the job complete only after verification.

## Non-negotiable rule

A click, keystroke, navigation, or submitted request is **not success**.
Success requires an observable post-condition.

Example:

```
click "Save"
!=
success

click "Save"
+ observe confirmation
+ verify persisted state
=
success
```
