# What the commands of the backup part share. What they say is in Bahasa
# Indonesia, and never holds a password, a key or the database's address.
# For the same reason what the tools themselves say is not shown: it can
# name the address, a file or a record.

# Where the backup folder of the settings is found inside this part.
BACKUPS=/backups
BACKUP_ENDING=.medali-backup
UNFINISHED_ENDING=.part

refuse() {
  echo "$1" >&2
  exit 1
}

require_setting() {
  local name=$1
  if [[ -z "${!name:-}" ]]; then
    refuse "Pengaturan $name masih kosong. Isi di .env.campus, lalu jalankan lagi perintah untuk memulai paket."
  fi
}

require_backup_settings() {
  require_setting BACKUP_FOLDER
  require_setting BACKUP_PASSWORD
}

remove_work_folder() {
  rm -rf "$WORK"
}

# The unlocked working copy: inside this part, never in the backup
# folder, and removed however the command ends.
make_work_folder() {
  WORK=$(mktemp -d)
  CONTENT=$WORK/content
  mkdir "$CONTENT"
  trap remove_work_folder EXIT
  trap 'exit 1' TERM INT
}

# The two keys are given on the tool's input, so they are in no address
# and on no command line.
connect_file_storage() {
  export MC_CONFIG_DIR=$WORK/files-tool
  mc alias set storage "$FILE_STORAGE_URL" >/dev/null 2>&1 <<KEYS
$FILE_STORAGE_ACCESS_KEY
$FILE_STORAGE_SECRET_KEY
KEYS
}

prepare_locking_tool() {
  mkdir --mode=700 "$WORK/locking-tool"
}

# The locking tool, with the backup password given on its own input,
# never on the command line. The caller opens that input as number 3.
locking_tool() {
  gpg --homedir "$WORK/locking-tool" --batch --yes --quiet \
    --pinentry-mode loopback --passphrase-fd 3 "$@"
}
