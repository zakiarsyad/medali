#!/usr/bin/env bash
# What the backup part runs while the package is up: one backup every
# night at the hour of the settings. What it says is the part's log.
set -euo pipefail
source /usr/local/lib/medali-backup/common.sh

# Run beside this script, so stopping the package is not held up until
# a wait or a backup ends.
beside() {
  "$@" &
  wait $!
}
trap 'exit 0' TERM INT

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
  beside backup || echo "Cadangan otomatis gagal. Cadangan yang lama tidak dihapus."
done
