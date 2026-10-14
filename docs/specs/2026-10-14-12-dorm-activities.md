# Dorm activities

Depends on: Dorm residents and rooms
Group: Asrama

## What we want

The tab Kegiatan asrama gets its schedule. Pengelola Asrama sets
activities that repeat (rutin: every day, some days of the week, or one
date a month) and one-off activities (non rutin), and marks days when a
repeating activity does not take place. Staff see the daily schedule;
residents see what is on today and next.

## Who it is for

- Change: Pengelola Asrama.
- Read only: Kepala Unit, Direktur / Wakil Direktur, Ketua Program Studi
  (their study program only) and every BAM role.
- Mahasiswa who live in the dorm, for the activities of their group.

## What should happen

- When staff open Kegiatan asrama, then they see the switch Jadwal
  harian, Kegiatan rutin and Kegiatan non rutin. Jadwal harian shows one
  date, with ‹ and › to move a day, and each activity with Waktu,
  Kegiatan (Rutin or Non rutin, category, location), Penanggung jawab,
  Peserta with the count, and its state: Akan datang, "Hari ini, belum
  dimulai", Berlangsung or Selesai.
- When they press "Rincian", then the activity shows its penanggung
  jawab, peserta and rincian kegiatan (lines of time and activity).
- When they open Kegiatan rutin or Kegiatan non rutin, then they see
  every repeating activity with its Pola, Waktu, Berlaku and "Hari tanpa
  kegiatan", or every one-off activity with its Tanggal and Status.
- When Pengelola Asrama presses "Tambah kegiatan rutin", then the form
  has Nama kegiatan, Kategori, Lokasi, Pola pengulangan (Harian,
  Mingguan with Hari, Bulanan with Tanggal setiap bulan 1 to 28), Berlaku
  mulai, Berlaku sampai (opsional), Hari tanpa kegiatan rutin ini, Mulai,
  Selesai, Penanggung jawab (UPK, Pelatih, BAM), Nama penanggung jawab,
  Peserta (Semua penghuni, Penghuni putra, Penghuni putri, or one dorm),
  Wajib hadir and Rincian kegiatan. "Tambah kegiatan non rutin" has
  Tanggal instead of the pattern fields.
- When they press "Simpan kegiatan", then it appears on every date it
  takes place, and a message confirms it. A name under 3 letters, an end
  time not after the start, Berlaku sampai before Berlaku mulai, or
  Mingguan with no day is refused with a message.
- When they press "Ubah" and then "Simpan perubahan", then the dates of
  that activity from today on show the change. Dates before today keep
  what they showed, also after "Hapus kegiatan". Confirmed by a check.
- When they press "Tiada kegiatan" on one date of a repeating activity
  and confirm, then that date no longer shows it, and the date is listed
  under "Hari tanpa kegiatan" in Kegiatan rutin.
- When they press "Hapus kegiatan" and confirm, then it leaves the
  schedule, and "Urungkan" in the message brings it back. It is marked
  as removed, not erased. Confirmed by a check.
- When a resident opens Kegiatan asrama, then they see "Hari ini" as
  cards with time, location, penanggung jawab and rincian, and "Akan
  datang" with the next six. Only activities for their group show.
- When Pengasuh or a student who does not live in the dorm types the
  address of Kegiatan asrama, then it is refused. When a BAM role sends a
  hand-made change to an activity, then the server refuses it. Confirmed
  by a check.
- When two people save changes to the same activity, then the second
  save is refused with "Kegiatan sudah diubah orang lain. Muat ulang."
  "Simpan kegiatan" pressed twice saves one. Confirmed by a check.
- When a resident opens the tab on a phone, then the cards stack in one
  column, and the staff schedule shows each activity as a card, with no
  sideways scroll.
- When the tab is opened on the preview, then it shows within about 1
  second. The schedule shows one day; Kegiatan non rutin is paged.

## Not included

- Attendance, percentages and history (Dorm attendance).
- Leave covering an activity (Dorm leave requests).

## Better than the prototype

- Any date can be opened; the prototype only knows three weeks around
  today.
- Removing an activity can be undone from the message.
- An activity in progress says Berlangsung, not "Presensi dibuka", and
  one of today that has not started says "Hari ini, belum dimulai", not
  "Hari ini, belum dibuka". Both old labels are left over from attendance
  by photo.
- Berlaku sampai before Berlaku mulai is refused.
- Two people changing the same activity cannot overwrite each other.

## Decided

1. Changing or removing a repeating activity does not change its past
   dates. Past dates stay as they happened; only today and later change.

## Steps

- [x] 1. The tables for dorm activities and their days off are added,
  with sample repeating and one-off activities.
- [x] 2. The rights to see and to manage dorm activities are added to
  the permission list, with their checks.
- [x] 3. Jadwal harian, Kegiatan rutin and Kegiatan non rutin show the
  schedule with "Rincian", read only.
- [ ] 4. The form adds and changes repeating and one-off activities;
  a change leaves past dates as they were.
- [ ] 5. "Tiada kegiatan" and "Hapus kegiatan" with undo work.
- [ ] 6. Residents see Hari ini and Akan datang.
