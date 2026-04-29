#!/bin/bash
# ============================================================
# CTRL_HUB — stop.sh
# Arrête proprement le stack Docker.
# ============================================================
set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

START_TS=$(date +%s)

echo -e "${CYAN}${BOLD}▶ HOMELAB // SHUTTING DOWN${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if docker info >/dev/null 2>&1; then
    DOCKER="docker"
else
    DOCKER="sudo docker"
fi

$DOCKER compose down

END_TS=$(date +%s)
DURATION=$((END_TS - START_TS))

echo ""
echo -e "${GREEN}${BOLD}▶ HOMELAB // OFFLINE${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${BOLD}STATUS${NC}  → ${DIM}● STOPPED${NC}"
echo -e "  ${BOLD}TIME${NC}    → ${DURATION}s"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
