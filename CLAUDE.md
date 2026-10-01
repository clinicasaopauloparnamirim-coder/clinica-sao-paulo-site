# Clínica São Paulo Agent Instructions

This file is a compatibility bridge for Claude Code and other Claude-compatible agents.

The authoritative project rules are in `AGENTS.md` and the operational workflow is in `.agents/skills/clinica-control-tower/SKILL.md`.

For repository-changing work:
- follow the Control Tower lifecycle;
- use the centralized policy kernel before production mutations;
- use the Gauntlet contract for material changes;
- verify the real artifact/resource after every mutation;
- never expose secrets;
- Search-2 remains protected unless explicitly authorized by the user;
- report INCONCLUSIVE when evidence is insufficient.

Do not duplicate or override the rules in AGENTS.md.
