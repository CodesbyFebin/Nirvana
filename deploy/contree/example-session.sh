#!/usr/bin/env bash
# NON-EXECUTING EXAMPLE — ConTree CLI branching workflow.
# Copied/adapted from https://github.com/nebius/contree-cli README.
# Requires Early-Access token via `contree auth`. Do NOT source this from Nirvana CI.
#
# Nirvana JeV gate: NO EXECUTION AUTHORIZED. This file is documentation only.
set -euo pipefail
echo "This script is a documented example. Aborting before any contree call." >&2
exit 1

# --- workflow (for a human with a token; not run by Nirvana) ---
# contree auth
# eval $(contree use tag:ubuntu:latest)
# contree run apt-get update -qq
# contree run apt-get install -y curl
# contree session branch experiment
# contree session checkout experiment
# contree run -- make test
# contree session checkout main
# contree session rollback -- -2
