#!/usr/bin/env bash
# Restores one backup: the database and the uploaded files come back as
# they were when it was made. A package that already holds data is left
# alone unless the word below is given, and then typed once more.
set -euo pipefail
source /usr/local/lib/medali-backup/common.sh
umask 077

REPLACE_WORD=GANTI-SEMUA
name=${1:-}
word=${2:-}

# What the locking tool reports is kept, to tell a password it refused
# from a backup it could not read to its end.
unpack() {
  prepare_locking_tool
  locking_tool --status-fd 4 --decrypt "$BACKUPS/$name" \
    3<<<"$BACKUP_PASSWORD" 4>"$WORK/unlocking" 2>/dev/null </dev/null |
    tar --extract --no-same-owner --directory "$CONTENT" 2>/dev/null
}

password_was_refused() {
  grep --quiet BAD_PASSPHRASE "$WORK/unlocking"
}

is_complete() {
  [[ -f "$CONTENT/database.sql" && -d "$CONTENT/files" ]]
}

ask_database() {
  psql --no-psqlrc --quiet --tuples-only --no-align \
    --set ON_ERROR_STOP=1 --command "$1" 2>/dev/null </dev/null
}

# A package holds data once it has an account, removed ones counted:
# nothing else can be entered before one exists.
holds_data() {
  local has_table has_account
  has_table=$(ask_database "SELECT to_regclass('public.accounts') IS NOT NULL") ||
    refuse "Pemulihan gagal: database tidak bisa dihubungi. Tidak ada yang diubah. Periksa bahwa paket berjalan, lalu coba lagi."
  [[ "$has_table" == t ]] || return 1
  has_account=$(ask_database "SELECT EXISTS (SELECT 1 FROM public.accounts)") ||
    refuse "Pemulihan gagal: database tidak bisa dibaca. Tidak ada yang diubah. Periksa bahwa paket berjalan, lalu coba lagi."
  [[ "$has_account" == t ]]
}

typed_the_word_again() {
  local answer=""
  echo "Paket ini sudah berisi data. Semua data dan berkasnya akan diganti dengan isi cadangan $name."
  echo "Ketik $REPLACE_WORD sekali lagi untuk melanjutkan:"
  read -r answer || true
  [[ "$answer" == "$REPLACE_WORD" ]]
}

add_files() {
  connect_file_storage &&
    mc mb --ignore-existing "storage/$FILE_STORAGE_BUCKET" \
      >/dev/null 2>&1 </dev/null &&
    mc mirror --quiet --overwrite "$CONTENT/files" \
      "storage/$FILE_STORAGE_BUCKET" >/dev/null 2>&1 </dev/null
}

# In one go: the database is emptied and filled from the backup fully, or
# it stays exactly as it was. A fault is shown by its code only, since
# its words can hold a record.
replace_database() {
  psql --no-psqlrc --quiet --single-transaction \
    --set ON_ERROR_STOP=1 --set VERBOSITY=sqlstate \
    --file /usr/local/lib/medali-backup/empty-database.sql \
    --file "$CONTENT/database.sql" >/dev/null </dev/null
}

remove_files_not_in_backup() {
  mc mirror --quiet --overwrite --remove "$CONTENT/files" \
    "storage/$FILE_STORAGE_BUCKET" >/dev/null 2>&1 </dev/null
}

require_backup_settings
is_backup_name "$name" ||
  refuse "Sebutkan nama cadangan yang dipulihkan, contoh: restore 2026-10-13-020000.medali-backup"
[[ -f "$BACKUPS/$name" ]] ||
  refuse "Cadangan $name tidak ada di folder cadangan."
[[ -z "$word" || "$word" == "$REPLACE_WORD" ]] ||
  refuse "Kata setelah nama cadangan hanya boleh $REPLACE_WORD."

make_work_folder
if ! unpack; then
  if password_was_refused; then
    refuse "Cadangan tidak bisa dibuka dengan BACKUP_PASSWORD yang sekarang. Tidak ada yang diubah. Isi BACKUP_PASSWORD dengan kata sandi yang dipakai saat cadangan ini dibuat."
  fi
  refuse "Cadangan $name rusak atau terpotong. Tidak ada yang diubah. Pakai cadangan yang lain."
fi
is_complete ||
  refuse "Cadangan $name tidak lengkap. Tidak ada yang diubah. Pakai cadangan yang lain."

if holds_data; then
  [[ "$word" == "$REPLACE_WORD" ]] ||
    refuse "Paket ini sudah berisi data, jadi tidak ada yang diubah. Untuk mengganti semuanya dengan isi cadangan, jalankan: restore $name $REPLACE_WORD"
  typed_the_word_again ||
    refuse "Dibatalkan. Tidak ada yang diubah."
fi

# The files are added first and the others removed last, so a restore
# that fails half way leaves the package with all the data it had.
add_files ||
  refuse "Pemulihan gagal: berkas unggahan tidak bisa disalin. Data paket tidak diubah. Periksa bahwa paket berjalan, lalu coba lagi."
replace_database ||
  refuse "Pemulihan gagal: database tidak bisa diganti, jadi tetap seperti semula. Periksa bahwa paket berjalan, lalu coba lagi."
remove_files_not_in_backup ||
  refuse "Database sudah dipulihkan, tetapi berkas yang tidak ada di cadangan belum dihapus. Jalankan lagi: restore $name $REPLACE_WORD"

echo "Pemulihan selesai: database dan berkas unggahan sudah kembali dari $name."
echo "Jalankan perintah ini agar aplikasi mulai lagi dan perubahan tabel yang masih perlu diterapkan:"
echo "  docker compose --file compose.campus.yaml restart app"
