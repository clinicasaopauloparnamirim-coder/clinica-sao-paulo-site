# Browser Harness Security & Execution Policy

## 1. Trust boundary

Browser Harness is an execution boundary. It may control a browser but may not
decide whether an action is allowed.

The Control Plane owns:

- target validation;
- authorization;
- capability selection;
- mutation policy;
- confirmation requirements;
- evidence requirements;
- job concurrency;
- audit state.

## 2. Browser isolation

### Allowed

- Dedicated local browser instance with no unrelated authenticated sessions.
- Dedicated remote Browser Use browser.
- Dedicated CI/browser environment.

### Prohibited

- User's everyday Chrome profile.
- Browser sessions containing unrelated personal accounts.
- Sharing one mutable browser lane between concurrent agents.
- Passing cookies or session tokens through source control.

## 3. Modes

### READ_ONLY

Allowed:

- navigation;
- screenshots;
- DOM/accessibility inspection;
- page information;
- non-mutating JavaScript;
- network inspection where permitted;
- validation of existing configuration.

### WRITE_GUARDED

Allowed only when:

- the target is explicitly identified;
- policy permits the operation;
- the operation has a defined post-condition;
- evidence is captured;
- the executor is isolated.

### DESTRUCTIVE

Requires an explicit policy decision and, where applicable, human confirmation.
Examples include deletion, irreversible publication, billing changes, credential
changes, account ownership changes, or actions with material financial impact.

## 4. Secrets

Never commit:

- Browser Use API keys;
- OAuth client secrets;
- refresh tokens;
- session cookies;
- browser profiles;
- screenshots containing credentials;
- authentication headers.

Secrets belong in the runtime secret store/environment.

## 5. Recordings

Recordings are disabled by default. Enable only for debugging, audit evidence,
or a user-requested demonstration. Treat recordings as sensitive artifacts.

## 6. Concurrency

One mutable local Browser Harness daemon is one browser execution lane.

The scheduler must serialize jobs that share a browser. Parallel jobs require
isolated browser workers.

## 7. Domain skills

Agent-generated domain skills are untrusted code/configuration until validated.
A generated helper may be proposed automatically but must not silently expand
the policy surface.

## 8. Failure handling

On ambiguity, stale UI, unexpected target, failed assertion, authentication
wall, or policy mismatch:

```
STOP -> CAPTURE EVIDENCE -> RETURN FAILURE -> DO NOT GUESS
```

The executor must never compensate for uncertainty by clicking additional
controls speculatively.

## 9. Audit record

Each job should record:

- job id;
- requested capability;
- target domain;
- browser worker id;
- start/end time;
- mode;
- actions performed;
- assertions;
- evidence references;
- final state;
- failure reason, if any.

Do not store raw credentials or session cookies.
