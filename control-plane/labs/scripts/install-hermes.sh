#!/usr/bin/env bash
# Hermes Agent — controlled install for Control Tower labs
# Does NOT auto-run interactive chat. Requires model API key after install.
set -euo pipefail
LAB="${HERMES_LAB_HOME:-$HOME/.hermes-lab}"
mkdir -p "$LAB"
export HERMES_HOME="$LAB"
echo "[labs] HERMES_HOME=$HERMES_HOME"
if command -v hermes >/dev/null 2>&1; then
  echo "[labs] hermes already on PATH: $(command -v hermes)"
  hermes --help 2>&1 | head -20 || true
  exit 0
fi
echo "[labs] Official installer: https://hermes-agent.nousresearch.com/install.sh"
echo "[labs] Review then run:"
echo "  curl -fsSL https://hermes-agent.nousresearch.com/install.sh -o /tmp/hermes-install.sh"
echo "  bash /tmp/hermes-install.sh"
echo "[labs] After install: hermes setup  OR  hermes setup --portal"
echo "[labs] Gate: read-only first; no production secrets"
