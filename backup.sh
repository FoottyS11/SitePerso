#!/usr/bin/env bash
# ============================================================
# backup.sh — Sauvegarde SQLite via API + git push + restart
# La rétention et la fréquence sont gérées par l'API.
# ============================================================
set -euo pipefail

SCRIPT_PATH="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="$PROJECT_DIR/data/backup-config.json"
LOG_FILE="$PROJECT_DIR/data/backup.log"
API_URL="http://localhost:3001/api"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

# ── Lire la config ──────────────────────────────────────────
read_config() {
  if command -v jq &>/dev/null && [ -f "$CONFIG_FILE" ]; then
    echo "$1:$(jq -r ".$1 // \"$2\"" "$CONFIG_FILE" 2>/dev/null || echo "$2")"
  else
    echo "$1:$2"
  fi
}

ENABLED=$(read_config enabled true | cut -d: -f2)
FREQUENCY=$(read_config frequency daily | cut -d: -f2)
HOUR=$(read_config hour 3 | cut -d: -f2)
WEEKDAY=$(read_config weekday 1 | cut -d: -f2)
RETENTION=$(read_config retention 2 | cut -d: -f2)

# ── Vérifier si c'est le bon jour (mode weekly) ─────────────
if [ "$ENABLED" = "false" ]; then
  log "Backup désactivé dans la config — arrêt"
  exit 0
fi

if [ "$FREQUENCY" = "weekly" ]; then
  TODAY=$(date +%u)  # 1=lun .. 7=dim
  # weekday config: 0=dim, 1=lun .. 6=sam (comme JS)
  # Convertir: JS weekday → date +%u
  JS_TO_ISO=$(( WEEKDAY == 0 ? 7 : WEEKDAY ))
  if [ "$TODAY" != "$JS_TO_ISO" ]; then
    log "Mode weekly — aujourd'hui n'est pas le jour configuré (config=$WEEKDAY, today=$TODAY) — arrêt"
    exit 0
  fi
fi

# ── Auto-update du cron si l'heure a changé ─────────────────
CRON_EXPR="0 $HOUR * * *"
if [ "$FREQUENCY" = "weekly" ]; then
  CRON_EXPR="0 $HOUR * * $WEEKDAY"
fi
EXPECTED_LINE="$CRON_EXPR $SCRIPT_PATH >> $LOG_FILE 2>&1"
CURRENT_LINE=$(crontab -l 2>/dev/null | grep "backup.sh" || true)

if [ "$CURRENT_LINE" != "$EXPECTED_LINE" ]; then
  (crontab -l 2>/dev/null | grep -v "backup.sh"; echo "$EXPECTED_LINE") | crontab -
  log "Cron mis à jour : $CRON_EXPR"
fi

log "══════════════════════════════════════"
log "Début sauvegarde (fréquence=$FREQUENCY, rétention=$RETENTION)"

# ── 1. Créer le backup via l'API ────────────────────────────
if curl -sf -X POST "$API_URL/backups" -o /tmp/backup_result.json 2>>"$LOG_FILE"; then
  if grep -q '"ok":true' /tmp/backup_result.json 2>/dev/null; then
    log "Backup créé via API ✓"
  else
    log "AVERTISSEMENT : réponse API inattendue"
    cat /tmp/backup_result.json >> "$LOG_FILE" 2>/dev/null || true
  fi
else
  # Fallback : copie directe du fichier SQLite si l'API est inaccessible
  log "API inaccessible — fallback copie directe"
  DB_SRC="$PROJECT_DIR/data/db/data.sqlite"
  BACKUP_DIR="$PROJECT_DIR/data/backups"
  mkdir -p "$BACKUP_DIR"
  if [ -f "$DB_SRC" ]; then
    TS=$(date +%Y%m%d_%H%M%S)
    DEST="$BACKUP_DIR/backup_${TS}.sqlite"
    cp "$DB_SRC" "$DEST"
    log "Copie directe : $(basename "$DEST")"
    # Rétention manuelle
    ls -1t "$BACKUP_DIR"/backup_*.sqlite 2>/dev/null | tail -n "+$((RETENTION + 1))" | while read -r OLD; do
      rm -f "$OLD"
      log "Supprimé (rétention) : $(basename "$OLD")"
    done
  else
    log "Aucune BDD trouvée à sauvegarder"
  fi
fi

# ── 2. Git push ─────────────────────────────────────────────
cd "$PROJECT_DIR"
if git push origin main >> "$LOG_FILE" 2>&1; then
  log "Git push OK"
else
  log "Git push : rien à pousser"
fi

# ── 3. Restart ──────────────────────────────────────────────
log "Redémarrage du site..."
bash "$PROJECT_DIR/restart.sh" >> "$LOG_FILE" 2>&1
log "Site redémarré"

log "Sauvegarde terminée"
log "══════════════════════════════════════"
