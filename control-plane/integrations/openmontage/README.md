# OpenMontage integration (isolated module)

Status: **registered for evaluation; not yet installed or runtime-verified**.

## Upstream

- Repository: https://github.com/calesthio/OpenMontage
- License: AGPL-3.0 (review obligations before redistribution or offering a modified network service).
- Do not substitute the similarly named `Open-Montage-app/OpenMontage` repository. Upstream project maintainers have published a security warning about lookalike installer distributions; use source from the `calesthio/OpenMontage` repository and do not download unofficial prebuilt installers.

## Architecture decision

OpenMontage is an **external audiovisual production module**, not part of the Control Tower core and not a Cloudflare Worker dependency. Keep its source/runtime isolated. The Control Tower may orchestrate it only through a separately implemented and tested adapter/API. Do not claim MCP connectivity until a live end-to-end test passes.

## Local setup (Windows PowerShell)

Run on the machine intended to host video production, not in the website deployment workflow:

```powershell
git clone https://github.com/calesthio/OpenMontage.git
Set-Location OpenMontage
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Set-Location remotion-composer
npm install
Set-Location ..
python -m pip install piper-tts
Copy-Item .env.example .env
```

Review `AGENT_GUIDE.md`, `PROJECT_CONTEXT.md`, and `.env.example` before running pipelines. Keep provider keys in local environment/secret storage; never commit `.env` or API keys. Installation may require additional system dependencies such as FFmpeg and may incur third-party API charges.

## Acceptance checks before integration

1. Record the upstream commit/tag and inspect dependencies and license.
2. Complete setup in an isolated environment; run documented capability discovery and tests.
3. Render a small non-clinical test video and validate output with ffprobe.
4. Define an authenticated, bounded adapter contract for Control Tower; do not expose a public unauthenticated execution endpoint.
5. Verify a request/response round trip and failure handling before marking the integration operational.

## Current evidence

This repository file only records the integration plan. It does **not** install OpenMontage on a host, fork/copy its source, create credentials, deploy a service, or prove a working connection.
