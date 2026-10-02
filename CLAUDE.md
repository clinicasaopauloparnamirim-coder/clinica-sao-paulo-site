# Clínica São Paulo Agent Instructions

This file is a compatibility bridge for Claude Code and other Claude-compatible agents.

The authoritative project rules are in `AGENTS.md` and the operational workflow is in `.agents/skills/clinica-control-tower/SKILL.md`.

For repository-changing work:
- follow the Control Tower lifecycle;
- use the centralized policy kernel before production mutations;
- use the Gauntlet contract for material changes;
- verify the real artifact/resource after every mutation;
- never expose secrets;
- Search-2 (ID 24146336625) is retired/out of scope and must never be operated, optimized, revived, or mutated; references are historical only;
- report INCONCLUSIVE when evidence is insufficient.

Do not duplicate or override the rules in AGENTS.md.
