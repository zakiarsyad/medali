# Counselling session notes

Depends on: Counselling consent, Counselling schedule changes and outcome
Group: Konseling

## What we want

Konselor writes down each counselling session on Konseling: date, kind,
main topic, confidential notes, the follow-up and the next session. A
session can be written only while the student's consent is "Disetujui".
The notes are read by Konselor only and are never shared.

## Who it is for

- Write, change and read: Konselor only.
- Mahasiswa: sees only how many sessions they had, the last date and the
  next session. Never the notes.
- No other role sees a session or its notes.

## What should happen

- When Konselor picks a student in "Persetujuan konseling" whose consent
  is not "Disetujui", then the panel says "Sesi konseling hanya dapat
  dicatat setelah mahasiswa menyetujui form consent" and shows no form.
- When consent is "Disetujui", then the panel shows "Catat sesi" with
  Tanggal sesi, Jenis (Individu tatap muka, Individu daring, Kelompok),
  Topik utama (Akademik, Adaptasi kampus, Keluarga, Relasi sosial,
  Keuangan, Emosi dan stres, Lainnya), "Catatan sesi (rahasia)", Tindak
  lanjut (Sesi lanjutan, Pemantauan, Rujuk ke psikolog klinis, Rujuk ke
  psikiater, Selesai) and Sesi berikutnya (optional).
- When Konselor confirms "Tandai selesai" on a schedule card and consent
  is "Disetujui", then the same form opens for that student, filled with
  the schedule's date and Cara. One session at most per schedule; a
  session may also be written with no schedule.
- When Konselor confirms "Tandai selesai" and consent is not
  "Disetujui", then the schedule is still "Selesai", no form opens, and
  the consent message shows.
- When Konselor presses "Simpan sesi", then a message confirms it and the
  session shows first in "Riwayat sesi": date, Jenis, Topik, the
  signed-in Konselor's name, Tindak lanjut, Sesi berikutnya and the
  notes. With no session it says "Belum ada sesi."
- When the date is in the future, Sesi berikutnya is before the session
  date, or the notes are empty, then nothing is saved and a message says
  why.
- When Konselor presses "Ubah" on a session and saves, then it shows the
  new content and "Diubah (date) oleh (name)".
- When the student opens Konseling, then they see "Sesi konseling: (n)
  sesi, terakhir (date)" and "Sesi berikutnya" when one is set.
- When consent is withdrawn after sessions were written, then every
  Konselor still reads the past sessions, "Ubah" is gone, and no new
  session can be written.
- When a student, Kepala Unit, Direktur / Wakil Direktur, Ketua Program
  Studi, Pengasuh or any role but Konselor sends a hand-made request to
  read or write a session, or Konselor sends one for a student without
  consent, then the server refuses it. The notes are never sent to the
  browser of anyone but Konselor. Confirmed by a check.
- When "Simpan sesi" is pressed twice, then one session is saved. When
  two Konselor change the same session at once, then the second is told
  it was changed and sees the new version. Confirmed by a check.
- When a session is written or changed, then a line goes to the log that
  cannot be changed: who, when, before and after. Sessions are never
  erased. Confirmed by a check.
- When Konselor opens a student's "Riwayat sesi", then that reading is
  logged: who, whose notes and when, never the notes themselves.
  Confirmed by a check.
- When opened on a phone, then the form and "Riwayat sesi" stack with no
  sideways scroll.
- When a student has many sessions, then "Riwayat sesi" shows the latest
  10 and loads more on request, within about 1 second on the preview.

## Not included

- Removing a session.
- Sharing anything about a session (Sharing a counselling summary).
- Mental-health screening results beside the sessions.

## Decided

1. Every Konselor reads every session note, so a colleague can take
   over; the log shows who changed what.
2. Each reading of a student's notes is logged: who, whose and when.
3. Topik utama uses the fixed list of the prototype.
4. After consent is withdrawn, past sessions can be read but not changed.
5. "Tandai selesai" without consent still marks the schedule "Selesai";
   no form opens.

## Steps

- [x] 1. The tables for sessions and their log are added, with made-up
  sessions for the sample students.
- [ ] 2. "Catat sesi" shows in the consent panel only with consent, and
  the server lets only Konselor write.
- [ ] 3. "Tandai selesai" opens the form for that schedule.
- [ ] 4. "Riwayat sesi" with "Ubah", and each reading is logged.
- [ ] 5. The student sees their number of sessions and the next session.
