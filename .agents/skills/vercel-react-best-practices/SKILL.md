---
name: vercel-react-best-practices
description: React and Next.js performance optimization guidelines from Vercel Engineering. Use when writing, reviewing, or refactoring React/Next.js code and when auditing browser-side JavaScript, rendering, loading, and performance patterns in web pages.
license: MIT
metadata:
  author: vercel
  source: vercel-labs/agent-skills
  source_skill: react-best-practices
  version: "1.0.0"
  verified: "2026-10-05"
---

# Vercel React Best Practices — Project Installation

Official Vercel Engineering skill, pinned by source identity to vercel-labs/agent-skills/skills/react-best-practices.

## Use in this repository

Apply the official rules when reviewing React/Next.js code and, where applicable, static HTML/browser JavaScript for:
- loading and request waterfalls;
- critical resource discovery and rendering;
- script loading and deferral;
- bundle and third-party loading;
- client-side event listeners;
- DOM/layout performance;
- JavaScript hot paths;
- hydration/client-only behavior;
- image/resource loading patterns.

Do not invent React-specific findings for plain HTML. Mark rules as NOT APPLICABLE when the repository does not contain the relevant React/Next.js construct.

## Audit protocol

1. Read the target artifact first.
2. Map only applicable Vercel rules to concrete code evidence.
3. Separate CONFIRMED, LIKELY, and NOT APPLICABLE findings.
4. Do not claim a performance regression without evidence; use static evidence when runtime measurement is unavailable.
5. Never mutate application code merely because a rule exists. Report the finding and its severity first.

## Priority

CRITICAL: async waterfalls, bundle size.
HIGH: server-side performance.
MEDIUM-HIGH: client fetching.
MEDIUM: rerender/rendering.
LOW-MEDIUM: JavaScript performance.
LOW: advanced patterns.

## Source

Official source: https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices

The full rule set remains maintained upstream. This project installation deliberately stores the current official skill entrypoint rather than copying generated compiled output, so stale compiled documentation is not treated as authoritative.