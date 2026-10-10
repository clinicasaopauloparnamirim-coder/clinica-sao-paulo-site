# Instagram Agent — Clínica São Paulo

This project-local integration imports the 13 skill definitions from [Jakeschincariol/instagram-agent-skill](https://github.com/Jakeschincariol/instagram-agent-skill), licensed under MIT. Original skill names and helper paths are preserved under `.agents/skills/ig-*/`.

## Skills available to the marketing brain

- `ig-audit`: post-performance audit
- `ig-caption`: caption writing and linting
- `ig-carousel`: carousel copy
- `ig-comment`: comments on other posts
- `ig-dm`: DM copy and follow-up drafts
- `ig-human`: humanize and score drafts
- `ig-plan`: weekly content planning
- `ig-profile`: profile audit
- `ig-reel`: Reels hooks, script, and beat sheet
- `ig-reply`: reply drafts
- `ig-repurpose`: repurpose long-form content
- `ig-story`: Story sequence and DM funnel drafts
- `ig-viral`: research and swipe-file workflow

## Runtime contract

1. Load the relevant `SKILL.md` into the MarketingGrowth agent context before using that workflow.
2. Resolve the clinic's brand voice from `templates/voice.md`; fill it with approved clinic facts and examples before production use.
3. Python helper scripts are optional runtime dependencies. Run them only in a Python-capable, isolated executor; Cloudflare Workers do not execute these Python files directly.
4. Treat every output as a draft. Human review is required. Do not auto-publish posts, send DMs/comments, or change Instagram account settings.
5. Use existing authorized Instagram/Meta connectors for account data only where they are already connected and tested. The skills themselves do not create API access.

## Provenance

Source: https://github.com/Jakeschincariol/instagram-agent-skill
Upstream ref imported: `main` (2026-10-10)
This is a prompt/skill integration, not proof of a deployed Instagram publishing pipeline.
