# Pengaturan: Clean-up of proof photos and attachments

Depends on: File storage, Academic period, Attendance photo upload, Attendance verification, Attendance clarification, SIKU addition requests, Return from leave, Dorm attendance clarification, Dorm violation appeals
Group: Pengaturan

## What we want

Proof photos show students' faces, and attachments can be sick notes.
Once the decision they supported is made and the semester is over, the
app has no reason to keep them. Kepala Unit gets a page that says how
long such files are kept and removes the older ones, while every record
keeps its status, its decision and who decided.

## Who it is for

- Set how long files are kept, and remove old files: Kepala Unit.
- Everyone who could open such a file before: they see "Berkas sudah
  dihapus" in its place.

## What should happen

- When Kepala Unit opens Pengaturan > Berkas bukti, then they see "Lama
  simpan berkas bukti" in days, empty at the start, and a table with one
  row per kind: Foto kehadiran kegiatan, Foto bukti SIKU, Foto laporan
  kembali, Lampiran klarifikasi kegiatan karakter, Lampiran klarifikasi
  asrama and Bukti advokasi pelanggaran. Each row shows how many files
  are kept and how many may be removed now.
- When the number of days is empty, then nothing may be removed, the
  button is off, and the page says "Lama simpan belum diatur. Tidak ada
  berkas yang dihapus."
- When they type a whole number from 30 to 3650 and press "Simpan",
  then it is kept and the counts update. Anything else is refused with a
  message.
- When a file is counted as removable, then both of these hold: its
  record has a final decision (verified, accepted, approved or
  rejected; a withdrawn request counts too), and the academic period it
  was sent in ended more than the set number of days ago. A file whose
  record still waits is never removable. Confirmed by a check.
- When they press "Hapus berkas lama", then they see how many files of
  each kind will go and the line "Berkas yang dihapus tidak dapat
  dikembalikan." When they confirm, then those files leave the file
  storage, the counts update, and the message says "(n) berkas
  dihapus."
- When someone opens a record whose file was removed, then every field,
  status and decision is as before, and where the picture or the file
  name was it says "Berkas sudah dihapus pada (date)."
- When a removed file is asked for by its old link, then it is not
  found, for every role. Confirmed by a check.
- When the removal stops half way, then no record points to a missing
  file without the mark, and pressing the button again finishes the
  rest. Confirmed by a check.
- When files are removed, then one line goes to the change log: who,
  when and how many of each kind, with no student's name. Confirmed by
  a check.
- When any role but Kepala Unit opens the page or sends a hand-made
  removal, then it is refused. Confirmed by a check.
- When the page is tried, then pictures with no person in them and
  made-up papers are used. A preview whose file storage settings are
  empty keeps no file, so the cases that remove a file are confirmed on
  a local computer or by a check.
- When the page is opened on a phone, then the table becomes cards with
  no sideways scroll, and it shows within about 1 second.

## Not included

- Removing files by itself on a timer; Kepala Unit presses the button.
- The CSV files kept by "Unggah berkas".
- Removing the records themselves, or any text in them.
- Removing one chosen file by hand.
- The number of days is a campus rule: it is a setting on this page,
  empty until the campus decides it.

## Decided

1. Nobody guesses how long proof is kept. The setting starts empty and
   nothing is removed until Kepala Unit fills it in.
2. Attachments are removed too, not only photos: an attachment is often
   proof of illness and is more private than a photo.
3. Files do not go by themselves when the time is up. One button for
   Kepala Unit, so nothing disappears unseen.
4. The time is counted from the end date of the academic period the file
   was sent in, so a whole semester goes together.

## Decisions made while building

1. A record is marked as removed before its file leaves the file
   storage, and the place of the file is cleared only once the file is
   gone. A marked record whose file is still there is finished by the
   next press, and is not counted as kept.
2. A marked file is never handed out again, even while it still waits
   to leave the file storage.
3. The academic period a file was sent in is the one whose dates hold
   the day it was sent. A file sent on a day no period holds is not
   removable, so nothing goes without a semester that is known to be
   over.
4. A SIKU request keeps each proof photo as a large and a small copy:
   both go together and count as one file.
5. A record with no file at all, such as sample data where no file
   storage is set, is not counted.
6. The change log line also keeps the number of days that was set when
   the files were removed.
7. What counts as a final decision for each kind: an attendance that is
   Hadir, Ditolak or Dispensasi; a SIKU request approved, rejected or
   withdrawn; a return report validated or rejected (one only verified
   by BAM still waits for Pengelola Asrama); a clarification accepted or
   rejected, and a dorm clarification also when it was closed because
   BAM announced the count again; an appeal accepted or rejected.
8. "Ended more than the set number of days ago" means the day after the
   period's last day plus the set days has passed: with 30 days, a period
   that ended on 31 January is removable from 3 March.
9. "Hapus berkas lama" is also off when no file may be removed now. It
   asks with the phone's or computer's own question box, as other
   removals in the app do.
10. One press removes every file that may go; it is not split into
    parts. When the file storage stops answering, the page says so and
    asks to press again, and that press finishes the rest. A place with
    no file storage refuses the removal with a message.
11. "Berkas sudah dihapus pada (date)" stands wherever a decided
    record showed its photo or file: Verifikasi presensi, Klarifikasi
    kehadiran and the student's Riwayat, Penilaian SIKU and the
    student's requests, Perizinan asrama, the dorm Klarifikasi kehadiran
    and the resident's Riwayat, and the resident's own violations. Lists
    of records that still wait, such as Tugas saya and Advokasi masuk,
    never hold a removed file, so they are left as they are.
12. The change log line is written together with the marks, so it
    counts the files that press set to go. A press that only finishes
    files marked by an earlier press that stopped writes no second line
    for them, and a press that removes nothing writes no line.

## Steps

- [x] 1. The setting for how long files are kept, and the right to set
  it and to remove files, with their checks.
- [x] 2. One rule that says which files are removable, with its check.
- [x] 3. The page with the setting and the table of counts.
- [x] 4. "Hapus berkas lama" with the confirmation, safe to press again.
- [x] 5. "Berkas sudah dihapus pada (date)" on each of the six kinds of
  record.
- [x] 6. The log line, the refusals and the phone layout.
