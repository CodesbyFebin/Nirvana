#!/usr/bin/env bash
# MetaPen tool-executor entrypoint — enforces scope.yaml presence (scope is law).
set -euo pipefail
SCOPE_FILE="${METAPEN_SCOPE_FILE:-/etc/metapen/scope.yaml}"
if [[ ! -f "$SCOPE_FILE" ]]; then
  echo "[metapen] REFUSING TO RUN: auth/scope file not found at $SCOPE_FILE" >&2
  echo "[metapen] owned-lab scope is law — no execution without scope.yaml." >&2
  exit 78  # EX_CONFIG
fi
echo "[metapen] scope.yaml present. Agent index: ${METAPEN_AGENT_INDEX:-unset}"
echo "[metapen] read-only recon by default; exploitation requires JeV approval."
exec "$@"
