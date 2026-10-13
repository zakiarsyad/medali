#!/usr/bin/env bash
# Makes one backup: the whole database and every uploaded file, locked
# with the backup password, as one dated file in the backup folder.
set -euo pipefail
source /usr/local/lib/medali-backup/common.sh
# A backup is read and written by this part only.
umask 077

remove_unfinished_and_work_folder() {
  rm -f "$UNFINISHED"
  remove_work_folder
}

copy_database() {
  pg_dump --no-owner --no-privileges --file "$CONTENT/database.sql" \
    2>/dev/null
}

copy_files() {
  mkdir "$CONTENT/files"
  connect_file_storage &&
    mc mirror --quiet "storage/$FILE_STORAGE_BUCKET" "$CONTENT/files" \
      >/dev/null 2>&1
}

lock_into() {
  prepare_locking_tool
  tar --create --directory "$CONTENT" database.sql files |
    locking_tool --symmetric --cipher-algo AES256 --output "$1" \
      3<<<"$BACKUP_PASSWORD" 2>/dev/null
}

name_of_now() {
  echo "$(date +%Y-%m-%d-%H%M%S)$BACKUP_ENDING"
}

# The name is the moment the backup is finished. A backup made in the
# same second waits for the next one.
free_name() {
  local name
  name=$(name_of_now)
  while [[ -e "$BACKUPS/$name" ]]; do
    sleep 1
    name=$(name_of_now)
  done
  echo "$name"
}

size_of() {
  numfmt --to=iec --suffix=B "$(stat --format=%s "$1")"
}

# Only a file with a backup's name counts. A name starts with the day
# and the time, so the order of the names is the order they were made in.
backup_names_newest_first() {
  local path name
  for path in "$BACKUPS"/*; do
    name=${path##*/}
    if [[ -f "$path" ]] && is_backup_name "$name"; then
      echo "$name"
    fi
  done | sort --reverse
}

remove_oldest_beyond() {
  local keep=$1 names name
  mapfile -t names < <(backup_names_newest_first)
  for name in "${names[@]:keep}"; do
    rm -f "$BACKUPS/$name"
    echo "Cadangan lama dihapus: $name"
  done
}

require_backup_settings
make_work_folder
# Written under a name that marks it as unfinished, and given its real
# name only once it is complete.
UNFINISHED=$(mktemp "$BACKUPS/XXXXXXXX$BACKUP_ENDING$UNFINISHED_ENDING") ||
  refuse "Cadangan gagal: folder cadangan tidak bisa ditulisi. Periksa BACKUP_FOLDER."
trap remove_unfinished_and_work_folder EXIT

# The database first, in one moment, and the files after it: so every
# file the database names is in the backup.
copy_database ||
  refuse "Cadangan gagal: database tidak bisa disalin. Periksa bahwa paket berjalan, lalu coba lagi."
copy_files ||
  refuse "Cadangan gagal: berkas unggahan tidak bisa disalin. Periksa bahwa paket berjalan, lalu coba lagi."
lock_into "$UNFINISHED" ||
  refuse "Cadangan gagal: tidak bisa ditulis ke folder cadangan. Periksa ruang kosong di BACKUP_FOLDER."

name=$(free_name)
mv "$UNFINISHED" "$BACKUPS/$name"
echo "Cadangan selesai: $name ($(size_of "$BACKUPS/$name"))."
# Only now, after the new one is complete, and never before.
remove_oldest_beyond "$(backup_keep)"
