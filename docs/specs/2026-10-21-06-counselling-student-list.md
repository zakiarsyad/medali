# Counselling student list

Depends on: Counselling consent, Counselling schedule changes and outcome, Counselling session notes, Sharing a counselling summary
Group: Konseling

## What we want

Konselor gets one list of every student they are working with ("Daftar
mahasiswa") on Konseling: consent, sessions, next session, active
schedule and sharing, side by side. From a row they open that student's
panels. It replaces looking students up one by one.

## Who it is for

- Konselor only. No other role has this list, in any form.

## What should happen

- When Konselor opens Konseling, then under the panels they see the
  numbers "Menunggu persetujuan" (form consent) and "Sesi 30 hari
  terakhir", and "Daftar mahasiswa" with every student who has a consent
  record, a schedule or a session.
- When they look at a row, then it shows name, NIM and program studi,
  "Persetujuan" (status or "Belum diminta"), "Konseling" ("(n) sesi,
  berikutnya (date)" or "-"), "Jadwal" (the active schedule's status and
  time or "-"), "Publikasi" (status or "-") and "Rincian".
- When they press "Rincian", then the row opens with that student's
  sessions: date, Jenis, Topik, konselor, Tindak lanjut, Sesi berikutnya
  and the notes, or "Belum ada sesi." "Tutup" closes it. Each opening is
  logged as a reading of that student's notes, as Counselling session
  notes does.
- When they press "Buka" on a row, then "Persetujuan konseling" and
  "Publikasi data kesehatan mental" above show that student, ready to
  work on.
- When they type in "Cari nama atau NIM" or pick the filter ("Semua",
  "Menunggu persetujuan", "Disetujui", "Ada sesi berikutnya"), then the
  list narrows; with no match it says "Tidak ada mahasiswa pada filter
  ini."
- When nothing exists yet, then the list says "Belum ada data
  konseling."
- When a consent, session, schedule or sharing changes, then the row and
  the numbers show it on the next load.
- When a student, Kepala Unit, Direktur / Wakil Direktur, Ketua Program
  Studi, Pengasuh, Pembina Disiplin Mahasiswa or Penilai Mahasiswa sends
  a hand-made request for the list, the numbers or a "Rincian", then the
  server refuses it and gives nothing back. Confirmed by a check.
- When Konselor opens "Rincian" while a colleague changes a session,
  then they see the saved version on the next load, never a half-saved
  one. Confirmed by a check.
- When opened on a phone, then each row becomes a card with the same
  facts and no sideways scroll.
- When the list is long, then it loads 20 rows at a time, the notes of a
  student load only when "Rincian" is opened, and the page shows within
  about 1 second.

## Not included

- The screening columns of the prototype's list ("Asesmen terakhir",
  "Tingkat", the filter "Perlu konseling"): they are in Mental health
  screening, which keeps its own "Daftar mahasiswa" on Penilaian.
- The Pengasuh column, until mentor groups exist.
- Numbers of counselling for other roles; the anonymous campus number is
  in Shared counselling data for recipients.
- Downloading the list.
- A name that opens the student detail: Konselor reaches their own
  small detail from Penilaian > Kesehatan mental (Scores in the student
  detail).
- Closing a counselling case, a "Selesai" mark in the Konseling column,
  and a link to the other "Daftar mahasiswa": the prototype has none.

## Better than the prototype

- The list is on Konseling with the panels it leads to, and a row opens
  the student in those panels.
- It can be searched, is paged, and shows the active schedule.
- Notes are fetched only when a row is opened, not for the whole list.

## Decided

1. A counselling case is not closed: no closing and no extra mark, as in
   the prototype.
2. No recap per Konselor.
3. Konselor keeps two lists named "Daftar mahasiswa": this one on
   Konseling, and the screening one on Penilaian > Kesehatan mental, each
   with its own columns.
4. One right, "Daftar mahasiswa konseling", covers the numbers, the
   list and "Rincian" with the session notes. Konselor alone has it, in
   the list of what each role may do.
5. "Menunggu persetujuan" counts every consent that waits for the
   student's answer.
6. "Sesi 30 hari terakhir" counts the sessions of every Konselor held
   from 30 days before today up to today, as "Sesi konseling 30 hari"
   of the recipients counts them and as the prototype does. Konselor
   sees the exact number, as they see each student anyway.
7. Any schedule puts a student in the list, also one that is over.
8. "berikutnya" is "Sesi berikutnya" of the student's latest session,
   while it is today or later, as the student's own page shows it.
9. "Jadwal" shows the active schedule (Diajukan, Usulan jadwal lain,
   Dijadwalkan, Menunggu jadwal or Minta jadwal ulang) that comes
   soonest, one with no time yet after those with one, with its time
   such as "Dijadwalkan, 26 Okt 2026 pukul 10:00".
10. "Publikasi" shows the latest sharing, current or ended, as
    "Publikasi data kesehatan mental" shows it.
11. The list is in name order. A removed student is not in it, nor the
    student of the account itself, as on the other lists of Konselor.
12. "Cari nama atau NIM" finds part of a name or a NIM. "Menunggu
    persetujuan" and "Disetujui" are the status of the consent; "Ada
    sesi berikutnya" is the next session of decision 8.
13. The search, the filter and the page are kept in the address. Using
    them shows the other lists of Konseling as they first open, as
    those lists already do with their own filters and pages.
14. "Rincian" shows the sessions as "Riwayat sesi" does, the latest 10
    first with "Tampilkan lebih banyak", read only: a session is changed
    in "Persetujuan konseling".
15. "Rincian" of a student with no session says "Belum ada sesi." and
    is logged as a reading as well. It does not wait for a consent, as
    the student may be listed by a schedule alone.
16. "Buka" shows to an account that may work on "Persetujuan
    konseling". It picks the student there and so in "Publikasi data
    kesehatan mental", and brings "Persetujuan konseling" into view, as
    "Tindak lanjuti" of a referral does.
17. A "Rincian" opened while a colleague's change is under way shows the
    version saved before it, without waiting for it.

## Steps

- [x] 1. The right to read the counselling list is added for Konselor
  only, with its checks.
- [x] 2. The numbers and "Daftar mahasiswa" with its columns and empty
  states.
- [x] 3. Search, filter and paging.
- [x] 4. "Rincian" with the sessions, and "Buka" into the panels.
