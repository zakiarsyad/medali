# What the commands of the backup part share. What they say is in Bahasa
# Indonesia, and never holds a password, a key or the database's address.
# For the same reason what the tools themselves say is not shown: it can
# name the address, a file or a record.

# Where the backup folder of the settings is found inside this part.
BACKUPS=/backups
BACKUP_ENDING=.medali-backup
UNFINISHED_ENDING=.part
# The day and the time a backup was made, and the ending. Only a file
# with such a name is ever taken for a backup.
BACKUP_NAME='^[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{6}\.medali-backup$'

is_backup_name() {
  [[ "$1" =~ $BACKUP_NAME ]]
}

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

HOUR_FORM='^([01][0-9]|2[0-3]):[0-5][0-9]$'
HOUR_UNREADABLE="Pengaturan BACKUP_HOUR tidak bisa dibaca. Isi dengan jam dan menit, contoh 02:00, atau kosongkan."
KEEP_FORM='^[1-9][0-9]{0,5}$'
KEEP_UNREADABLE="Pengaturan BACKUP_KEEP tidak bisa dibaca. Isi dengan angka bulat, paling kecil 1, atau kosongkan."

# The hour of the nightly backup, in campus time.
backup_hour() {
  echo "${BACKUP_HOUR:-02:00}"
}

# How many backups are kept.
backup_keep() {
  echo "${BACKUP_KEEP:-14}"
}

hour_is_readable() {
  [[ "$(backup_hour)" =~ $HOUR_FORM ]]
}

keep_is_readable() {
  [[ "$(backup_keep)" =~ $KEEP_FORM ]]
}

require_backup_settings() {
  require_setting BACKUP_FOLDER
  require_setting BACKUP_PASSWORD
  hour_is_readable || refuse "$HOUR_UNREADABLE"
  keep_is_readable || refuse "$KEEP_UNREADABLE"
}

# How many seconds from a moment, given in seconds since 1970, until the
# clock next shows the hour and minute given.
seconds_until() {
  local hour=$1 now=$2 day next
  day=$(date --date="@$now" +%F)
  next=$(date --date="$day $hour" +%s)
  if ((next <= now)); then
    next=$(date --date="$day $hour tomorrow" +%s)
  fi
  echo $((next - now))
}

# The locking tool leaves a helper running that would outlive the
# command, so it is stopped first.
remove_work_folder() {
  gpgconf --homedir "$WORK/locking-tool" --kill gpg-agent 2>/dev/null || true
  rm -rf "$WORK"
}

WORK_FOLDERS=/tmp/medali-backup-work

# A command that was killed, as when the package is stopped while it
# runs, cannot remove its unlocked working copy. Whoever has the turn
# may remove it: no other command is using one.
remove_stale_work_folders() {
  rm -rf "$WORK_FOLDERS".*
}

# The unlocked working copy: inside this part, never in the backup
# folder, and removed however the command ends.
make_work_folder() {
  WORK=$(mktemp --directory "$WORK_FOLDERS.XXXXXXXX")
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
# Its helper is not given the turn below, or it could keep it after the
# command ended.
locking_tool() {
  gpg --homedir "$WORK/locking-tool" --batch --yes --quiet \
    --pinentry-mode loopback --passphrase-fd 3 "$@" 9>&-
}

# One backup or restore at a time; the turn ends with the command. It is
# kept inside this part, not in the backup folder, which may be on a
# disk of another server where a turn cannot be kept.
take_turn() {
  exec 9>/tmp/medali-backup.turn
  flock --nonblock 9 ||
    refuse "Cadangan atau pemulihan lain sedang berjalan. Tunggu sampai selesai, lalu coba lagi."
}
