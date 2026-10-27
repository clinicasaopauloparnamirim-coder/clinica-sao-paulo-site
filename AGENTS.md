# Agent Operating Rules — Clínica São Paulo

For **every Clínica operational task**, including read-only Google Ads/GA4/Search Console/SEO reports, daily marketing reviews, content planning, integrations, deployments, and repository changes, follow this entry procedure:
1. Read this file.
2. Read `.agents/skills/clinica-control-tower/SKILL.md` as the canonical protocol.
3. Read the latest continuity/status records in `control-plane/registry/`.
4. Inspect actual connected tools and current state before selecting a route. Do not assume a status file is live proof.

A request to fetch yesterday's metrics is an operational task even when no files or campaigns will be changed. Apply the skill and GAUNTLET LOOP to read-only work too.

The required operating loop is:

**understand → define done → map routes → plan safely → execute → verify → critique → re-verify → record evidence**

A response, plan, prompt, available adapter, or successful connection check is not proof of task completion. Read back the real source and compare results before reporting.

## Non-negotiable scope rules
- **HYPD is retired by the user's explicit decision. Never invoke it, route through it, or ask the user to re-enable it.**
- Google Ads direct route takes priority for Ads reads. For routine campaign reports, scope GAQL to active campaign ID `24289443969`, customer `4603647788`, and the exact requested date.
- **Campaign `Search-2` (ID `24146336625`) is excluded from queries, reports, analysis, and mutations unless the user explicitly authorizes that exact campaign in the current task.**
- Resolve relative dates in `America/Fortaleza`. State the exact date range.
- Daily reports must cross-read Google Ads, GA4, Search Console, and OpenSEO when tools are available. A blocked source does not cancel the other reads. Label each source VERIFIED, INCOMPLETE, BLOCKED, or NOT CHECKED.
- If a combined/batch call is blocked, classify it and use independent single-source calls. Do not repeat the same failed call without a new hypothesis.
- Never ask for screenshots, copied output, or reconnection before testing available authorized read routes.
- Do not claim that a repository update changes all ChatGPT chats. These rules only apply in environments that actually load them; if bootstrap was not recovered, report that limitation rather than pretending continuity.

## Safety
- Never commit, reveal, echo, or log secrets or tokens.
- Preserve production architecture unless explicitly authorized to change it.
- Do not mutate campaigns or publish social content in a reporting workflow.
- Report `INCONCLUSIVE` when the evidence is insufficient.
- For React/Next.js or browser-performance audits, also apply `vercel-react-best-practices` where relevant.
