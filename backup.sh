#!/usr/bin/env bash
# ============================================================
# backup.sh — Sauvegarde quotidienne + git push + restart
# Rétention : 2 backups gardés sur la machine
# ============================================================
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="$PROJECT_DIR/data/backups"
DB_DIR="$PROJECT_DIR/data/db"
LOG_FILE="$PROJECT_DIR/data/backup.log"
RETENTION=2
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE="$BACKUP_DIR/backup_${TIMESTAMP}.tar.gz"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

mkdir -p "$BACKUP_DIR"

log "══════════════════════════════════════"
log "Début sauvegarde"

# ── 1. Créer l'archive ──────────────────────────────────────
tar -czf "$ARCHIVE" \
  --ignore-failed-read \
  -C "$PROJECT_DIR" \
  data/db \
  .env \
  docker-compose.yml \
  2>>"$LOG_FILE" || true

SIZE=$(du -sh "$ARCHIVE" | cut -f1)
log "Archive créée : $(basename "$ARCHIVE") ($SIZE)"

# ── 2. Rétention : supprimer les anciens backups ────────────
TOTAL=$(ls -1 "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | wc -l)
if [ "$TOTAL" -gt "$RETENTION" ]; then
  ls -1t "$BACKUP_DIR"/backup_*.tar.gz | tail -n "+$((RETENTION + 1))" | while read -r OLD; do
    rm -f "$OLD"
    log "Backup supprimé (rétention=$RETENTION) : $(basename "$OLD")"
  done
fi
log "Backups conservés : $(ls -1 "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | wc -l)/$RETENTION"

# ── 3. Git push ─────────────────────────────────────────────
cd "$PROJECT_DIR"
if git push origin main >> "$LOG_FILE" 2>&1; then
  log "Git push OK"
else
  log "Git push : rien à pousser ou pas de changements"
fi

# ── 4. Restart site ─────────────────────────────────────────
log "Redémarrage du site..."
bash "$PROJECT_DIR/restart.sh" >> "$LOG_FILE" 2>&1
log "Site redémarré"

log "Sauvegarde terminée"
log "══════════════════════════════════════"
