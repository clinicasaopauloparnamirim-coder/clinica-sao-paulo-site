#!/usr/bin/env bash
# Prefer connected MCP github___* tools when available.
# Public API may rate-limit without token.
set -euo pipefail
echo "=== GitHub smoke ==="
echo "Use MCP: github___get_me, github___get_file_contents, github___push_files"
echo "Production repo: clinicasaopauloparnamirim-coder/clinica-sao-paulo-site"
echo "Hermes: NousResearch/hermes-agent"
echo "Composio: ComposioHQ/composio"
echo "Open-dot: composio-community/open-dot"
echo "DONE"
