#!/usr/bin/env bash
# What the backup part runs while the package is up: one backup every
# night at the hour of the settings. What it says is the part's log.
set -euo pipefail
source /usr/local/lib/medali-backup/common.sh

# Run beside this script, so a stop reaches it at once and is not held
# up until a wait or a backup ends.
RUNNING=
beside() {
  "$@" &
  RUNNING=$!
  wait "$RUNNING"
}

# Stopping the package stops only this script. A backup running beside
# it is told to stop too, with the tool it is waiting for, and is waited
# for: so it removes its unlocked working copy and its unfinished file
# before the part is gone.
stop() {
  if [[ -n "$RUNNING" ]]; then
    kill "$RUNNING" 2>/dev/null || true
    pkill --parent "$RUNNING" 2>/dev/null || true
    wait "$RUNNING" 2>/dev/null || true
  fi
  exit 0
}
trap stop TERM INT

why_no_nightly_backup() {
  if [[ -z "${BACKUP_FOLDER:-}" ]]; then
    echo "Cadangan otomatis belum diatur."
    return
  fi
  if ! hour_is_readable; then
    echo "$HOUR_UNREADABLE Cadangan otomatis tidak berjalan."
    return
  fi
  if ! keep_is_readable; then
    echo "$KEEP_UNREADABLE Cadangan otomatis tidak berjalan."
  fi
}

reason=$(why_no_nightly_backup)
if [[ -n "$reason" ]]; then
  echo "$reason"
  # Stays up, so the two commands can still be run here and say why
  # they refuse.
  beside sleep infinity
  exit 0
fi

if [[ -z "${BACKUP_PASSWORD:-}" ]]; then
  echo "Pengaturan BACKUP_PASSWORD masih kosong: cadangan otomatis akan gagal setiap malam sampai diisi."
fi
echo "Cadangan otomatis berjalan setiap hari pukul $(backup_hour). Yang disimpan: $(backup_keep) cadangan terbaru."

while true; do
  beside sleep "$(seconds_until "$(backup_hour)" "$(date +%s)")"
  beside backup ||
    echo "$(date '+%Y-%m-%d %H:%M') Cadangan otomatis gagal. Cadangan yang lama tidak dihapus."
done
