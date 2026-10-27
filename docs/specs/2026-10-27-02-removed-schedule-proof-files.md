# Waiting photos and attachments of a removed schedule on Berkas bukti

Depends on: nothing
Group: Launch
Kind: fix, found by "App-wide audit: Launch"

## What we want

When "Hapus jadwal" removes a schedule, the attendance photos and
clarification attachments sent for it that were still waiting stay
waiting forever: the schedule leaves Verifikasi presensi and Klarifikasi
kehadiran, so nobody can decide them, and "Hapus berkas lama" never
removes a file whose record still waits. Photos show students' faces, so
they stay in the file storage for good. After this work they go with the
other old files.

Seen on a local computer with sample data, as Kepala Unit: a PPKS
schedule with 12 waiting photos was removed. The 12 stayed waiting and in
the file storage, Berkas bukti still counted them as kept (174 kept, 0 may
be removed), and Verifikasi presensi no longer showed them.

A "Kegiatan tambahan" student taken out of the participants is not
affected: their waiting photo stays in Verifikasi presensi and can still
be decided.

## Who it is for

Kepala Unit, who removes old proof files on Pengaturan > Berkas bukti.

## What should happen

- When a schedule is removed with "Hapus jadwal", then its waiting photos
  and its waiting clarification attachments count on Berkas bukti like
  files whose decision is made. Confirmed by a check.
- When the academic period of such a file ended more than the set number
  of days ago, then it counts under "may be removed now", and "Hapus
  berkas lama" removes it with the others.
- When such a file is removed, then its record keeps its status and the
  schedule stays marked as removed, as for any other removed file.
- When a schedule that is not removed has waiting files, then they are
  never removed, as today. Confirmed by a check.
- When the number of days is empty, then nothing is removed, as today.

## Not included

- Removing files by themselves when a schedule is removed; Kepala Unit
  still presses the button.
- Bringing a removed schedule back.
- Removing the records themselves.

## Decisions

1. The files do not go at once when the schedule is removed. They wait
   for the same keeping time as every other proof file, so nothing
   disappears unseen.
2. Attachments of waiting clarifications count too, for the same
   reason; an attachment can be a sick note.
3. Decided while building: a file of a removed schedule counts as
   decided whatever status its record has, and its keeping time runs
   from the academic period it was sent in, like every other file.

## Steps

- [x] 1. Files of a removed schedule count as decided on Berkas bukti
  and go with "Hapus berkas lama", with checks.
