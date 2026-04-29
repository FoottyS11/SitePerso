#!/bin/bash
# ============================================================
# CTRL_HUB — restart.sh
# Redémarre le stack Docker avec rebuild auto si les sources changent.
# Usage : ./restart.sh [--rebuild] [--pull]
#   --rebuild  Force le rebuild de l'image (ignore le hash)
#   --pull     git pull avant de redémarrer
# ============================================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

FORCE_REBUILD=0
GIT_PULL=0

for arg in "$@"; do
  case $arg in
    --rebuild) FORCE_REBUILD=1 ;;
    --pull)    GIT_PULL=1 ;;
    --help|-h)
      echo "Usage: ./restart.sh [--rebuild] [--pull]"
      echo "  --rebuild  Force le rebuild Docker (ignore le cache de hash)"
      echo "  --pull     git pull --ff-only avant de redémarrer"
      exit 0
      ;;
  esac
done

echo -e "${CYAN}${BOLD}▶ CTRL_HUB // RESTART${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# ─── git pull optionnel ─────────────────────────────────────
if [ "$GIT_PULL" -eq 1 ]; then
  echo -e "${DIM}→ git pull --ff-only${NC}"
  if git pull --ff-only; then
    echo -e "${GREEN}✓ Sources à jour${NC}"
  else
    echo -e "${RED}✗ git pull échoué — on continue quand même${NC}"
  fi
  echo ""
fi

# ─── Rebuild forcé ─────────────────────────────────────────
if [ "$FORCE_REBUILD" -eq 1 ]; then
  echo -e "${YELLOW}→ --rebuild : suppression du hash (rebuild forcé)${NC}"
  rm -f data/.build_hash
  echo ""
fi

# ─── Stop ──────────────────────────────────────────────────
bash ./stop.sh
echo ""

# ─── Start ─────────────────────────────────────────────────
bash ./start.sh
echo ""

# ─── Logs récents ──────────────────────────────────────────
if docker info >/dev/null 2>&1; then
  DOCKER="docker"
else
  DOCKER="sudo docker"
fi

echo -e "${CYAN}${BOLD}▶ LOGS RÉCENTS (20 dernières lignes)${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
$DOCKER compose logs --tail=20 2>/dev/null || true
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${DIM}Suivi temps réel : docker compose logs -f${NC}"
