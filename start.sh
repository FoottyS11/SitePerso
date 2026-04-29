#!/bin/bash
# ============================================================
# CTRL_HUB — start.sh
# Provisionne et lance l'environnement Docker du dashboard.
# Compatible machine Ubuntu/Debian fraîche (zéro dépendance préalable).
# ============================================================
set -e

# S'assure que ce script et ses voisins sont exécutables (utile au premier run après un git clone)
chmod +x "$0" 2>/dev/null || true
[ -f stop.sh ]    && chmod +x stop.sh    2>/dev/null || true
[ -f restart.sh ] && chmod +x restart.sh 2>/dev/null || true

# ─── Couleurs ──────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

START_TS=$(date +%s)

echo -e "${CYAN}${BOLD}▶ HOMELAB // STARTING UP${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# ─── 1. Vérification des droits ────────────────────────────
if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}⚠  Script lancé en root direct.${NC}"
    echo -e "${DIM}   Recommandé : exécuter depuis un user normal avec sudo (ce script l'utilisera quand nécessaire).${NC}"
fi

if [ "$EUID" -eq 0 ]; then
    SUDO=""
else
    SUDO="sudo"
fi

# ─── 2. Dépendances système ────────────────────────────────
APT_UPDATED=0
apt_update_once() {
    if [ "$APT_UPDATED" -eq 0 ]; then
        echo -e "${DIM}→ apt-get update${NC}"
        $SUDO apt-get update -qq
        APT_UPDATED=1
    fi
}

install_pkg() {
    local pkg="$1"
    if ! command -v "$pkg" >/dev/null 2>&1; then
        echo -e "${YELLOW}→ Installation : ${pkg}${NC}"
        apt_update_once
        $SUDO apt-get install -y -qq "$pkg"
    fi
}

install_pkg curl
install_pkg git

# Docker Engine (pas Docker Desktop)
if ! command -v docker >/dev/null 2>&1; then
    echo -e "${YELLOW}→ Installation : Docker Engine (via get.docker.com)${NC}"
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    $SUDO sh /tmp/get-docker.sh
    rm -f /tmp/get-docker.sh
    if [ "$EUID" -ne 0 ]; then
        $SUDO usermod -aG docker "$USER" || true
        echo -e "${YELLOW}⚠  Tu as été ajouté au groupe 'docker'.${NC}"
        echo -e "${YELLOW}   Reconnecte-toi (logout/login) pour que ça prenne effet sans sudo.${NC}"
        echo -e "${DIM}   En attendant, ce script continue avec sudo.${NC}"
    fi
fi

# Docker Compose plugin (v2)
if ! docker compose version >/dev/null 2>&1 && ! $SUDO docker compose version >/dev/null 2>&1; then
    echo -e "${YELLOW}→ Installation : docker-compose-plugin${NC}"
    apt_update_once
    $SUDO apt-get install -y -qq docker-compose-plugin || true
fi

# Node.js 20 — uniquement pour le dev local (pas requis pour le build Docker)
if ! command -v node >/dev/null 2>&1; then
    echo -e "${CYAN}→ Installation optionnelle : Node.js 20 (utile pour 'npm run dev' hors Docker)${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO bash - >/dev/null 2>&1 || true
    $SUDO apt-get install -y -qq nodejs >/dev/null 2>&1 || true
fi

# ─── 3. Fichier .env ───────────────────────────────────────
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠  .env absent — copie de .env.example${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠  Pense à remplir .env avec tes vraies valeurs avant la prochaine prod.${NC}"
fi

# ─── 4. Dossiers data/ ─────────────────────────────────────
mkdir -p data/db data/backups

# ─── 5. Détection rebuild ──────────────────────────────────
HASH_FILE="data/.build_hash"
CURRENT_HASH=""
if [ -d app/src ] && [ -f app/package.json ]; then
    CURRENT_HASH=$(
        { find app/src -type f \( -name '*.js' -o -name '*.jsx' -o -name '*.ts' -o -name '*.tsx' -o -name '*.css' -o -name '*.html' \) -print0 2>/dev/null;
          printf '%s\0' app/package.json app/vite.config.js nginx/default.conf app/Dockerfile 2>/dev/null;
        } | xargs -0 sha256sum 2>/dev/null | sort | sha256sum | awk '{print $1}'
    )
fi
LAST_HASH=""
[ -f "$HASH_FILE" ] && LAST_HASH=$(cat "$HASH_FILE" 2>/dev/null || echo "")

REBUILD_FLAG=""
if [ -z "$LAST_HASH" ] || [ "$CURRENT_HASH" != "$LAST_HASH" ]; then
    echo -e "${YELLOW}→ Sources modifiées — rebuild nécessaire${NC}"
    REBUILD_FLAG="--build"
else
    echo -e "${DIM}→ Sources inchangées — image existante réutilisée${NC}"
fi

# ─── 6. Choix de la commande docker (avec ou sans sudo) ────
if docker info >/dev/null 2>&1; then
    DOCKER="docker"
else
    DOCKER="$SUDO docker"
fi

# ─── 7. Lancement ──────────────────────────────────────────
echo -e "${CYAN}→ docker compose up -d ${REBUILD_FLAG}${NC}"
$DOCKER compose up -d $REBUILD_FLAG

# Sauvegarde du hash après build réussi
[ -n "$CURRENT_HASH" ] && echo "$CURRENT_HASH" > "$HASH_FILE"

# ─── 8. Attente container healthy ──────────────────────────
echo -e "${CYAN}→ Attente du démarrage HTTP (timeout 60s)…${NC}"
TIMEOUT=60
ELAPSED=0
HEALTHY=0
while [ $ELAPSED -lt $TIMEOUT ]; do
    if curl -fsS -o /dev/null -m 2 http://localhost/ 2>/dev/null; then
        HEALTHY=1
        break
    fi
    sleep 2
    ELAPSED=$((ELAPSED + 2))
done

# ─── 9. Résumé ─────────────────────────────────────────────
LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
[ -z "$LAN_IP" ] && LAN_IP="(détection impossible)"
END_TS=$(date +%s)
DURATION=$((END_TS - START_TS))

echo ""
if [ $HEALTHY -eq 1 ]; then
    echo -e "${GREEN}${BOLD}▶ HOMELAB // ONLINE${NC}"
    STATUS="${GREEN}● RUNNING${NC}"
else
    echo -e "${YELLOW}${BOLD}▶ HOMELAB // STARTED (HTTP non confirmé)${NC}"
    STATUS="${YELLOW}● STARTED — vérifie 'docker compose logs'${NC}"
fi
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${BOLD}LOCAL${NC}   → http://localhost"
echo -e "  ${BOLD}LAN${NC}     → http://${LAN_IP}"
echo -e "  ${BOLD}STATUS${NC}  → ${STATUS}"
echo -e "  ${BOLD}TIME${NC}    → ${DURATION}s"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
