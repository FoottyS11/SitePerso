#!/bin/bash
# ============================================================
# CTRL_HUB — restart.sh
# Stop + Start + tail des logs récents.
# ============================================================
set -e

CYAN='\033[0;36m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

bash ./stop.sh
echo ""
bash ./start.sh
echo ""

if docker info >/dev/null 2>&1; then
    DOCKER="docker"
else
    DOCKER="sudo docker"
fi

echo -e "${CYAN}${BOLD}▶ HOMELAB // RECENT LOGS${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
$DOCKER compose logs --tail=20 || true
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${DIM}(suivi temps réel : docker compose logs -f)${NC}"
