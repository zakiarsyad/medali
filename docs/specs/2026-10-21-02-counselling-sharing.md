# Sharing a counselling summary

Depends on: Counselling session notes, Counselling consent
Group: Konseling

## What we want

Konselor may share a little about a student with the staff who look
after them ("Publikasi data kesehatan mental"), but only after the
student agrees to exactly what is shared and with whom. Konselor asks,
the student approves, Konselor publishes. Either side can stop it at any
time. Session notes are never shared.

## Who it is for

- Ask, publish and withdraw: Konselor, for any student.
- Approve, decline and withdraw: Mahasiswa, for themselves only.
- Recipients read the result in Shared counselling data for recipients.
  Until "Dipublikasikan", nobody else sees anything.

## What should happen

- When Konselor picks a student with at least one session, then the
  panel "Publikasi data kesehatan mental" offers "Data yang dibagikan"
  ("Status, jadwal, dan rencana tindak lanjut konseling, tanpa isi
  sesi"; "Ringkasan pendampingan yang ditulis konselor"), "Penerima"
  (Kepala Unit, Direktur / Wakil Direktur, Ketua Program Studi and
  Pengasuh of this student only), "Ringkasan untuk penerima" and "Minta
  persetujuan mahasiswa". No recipient is ticked at the start.
- When the student has no session, then the panel says so and offers
  nothing.
- When Konselor sends with no data, no recipient, or a summary under 10
  letters while the summary is chosen, then nothing is saved and the
  prototype's message says why.
- When the request is sent, then the status is "Menunggu persetujuan"
  and the student sees on Konseling "Permintaan persetujuan berbagi
  data" with the recipients, the data, the exact summary text, the note
  that session notes are never shared, and "Setujui berbagi data" and
  "Tolak".
- When the student presses "Tolak", then the status is "Ditolak" and
  Konselor may send a new request.
- When the student approves, then the status is "Disetujui" and
  Konselor sees "Publikasikan". Recipients see nothing yet.
- When Konselor presses "Publikasikan", then the status is
  "Dipublikasikan" with the date and their name, and the student sees
  "Data dibagikan kepada (recipients)" with what is shared.
- When Konselor presses "Catat persetujuan tertulis" on a waiting
  request and confirms, then it is "Disetujui" with "Form tertulis".
- When Konselor presses "Batalkan permintaan", "Batalkan" or "Tarik
  publikasi", or the student presses "Cabut persetujuan berbagi", and
  confirms, then the status becomes "Ditarik" or "Dicabut", recipients
  stop seeing the data at once, and Konselor may send a new request.
- When the student withdraws their consent to counselling, then a
  current sharing becomes "Dicabut" at once and recipients stop seeing
  the data. Confirmed by a check.
- When Konselor wants other data, recipients or summary after the
  student approved, then they must withdraw and send a new request.
- When a student acts on another student's sharing, Konselor publishes
  one that is not "Disetujui", or Pengasuh, Kepala Unit or any other
  role sends a hand-made request to ask, approve or publish, then the
  server refuses it. Confirmed by a check.
- When the student withdraws while Konselor publishes, then the
  withdrawal wins and nothing is shown. A student has at most one
  current sharing. Confirmed by a check.
- When any step happens, then a line goes to the log that cannot be
  changed: who, when, status before and after, and what was shared with
  whom. Nothing is erased. Confirmed by a check.
- When opened on a phone, then the panel and the student's box fit with
  no sideways scroll, and the panel shows within about 1 second.

## Not included

- The screen where recipients read the shared data (Shared counselling
  data for recipients).
- Sharing the screening level and its advice.
- Pengelola Asrama and BAM as recipients.

## Better than the prototype

- Konselor's panel and the student's answer are on Konseling, not on
  Penilaian > Kesehatan mental and Profil saya.
- Any change to what is shared needs a new approval.
- Recording a paper approval, cancelling and "Tarik publikasi" ask for
  a confirmation.
- A withdrawal and a publish at the same moment: the withdrawal wins.

## Decided

1. Withdrawing the consent to counselling also stops the sharing: a
   current sharing, waiting, approved or published, becomes "Dicabut"
   at once, in the same change as the consent.
2. No recipient is ticked at the start; Konselor ticks each one on
   purpose. Both kinds of data start unticked as well, so nothing is
   chosen for the student by default.
3. A sharing can be asked for only while the student's consent to
   counselling is "Disetujui", as it stops when that consent is
   withdrawn. While it is not, the panel says so and offers nothing.
4. The panel sits under "Persetujuan konseling" and is about the student
   picked there, so the student is picked once for both.
5. A student with no session sees "Belum ada sesi konseling untuk
   mahasiswa ini.", the prototype's words without the screening, which
   is not shared here.
6. The messages are the prototype's: "Pilih data yang akan dibagikan.",
   "Pilih minimal satu penerima.", "Tulis ringkasan untuk penerima.",
   "Permintaan persetujuan dikirim ke (name).", "Persetujuan tertulis
   dicatat.", "Data kesehatan mental (name) dipublikasikan.",
   "Permintaan dibatalkan.", "Publikasi ditarik.", "Persetujuan
   diberikan. Konselor dapat mempublikasikan data.", "Permintaan berbagi
   data ditolak." and "Persetujuan dicabut. Data tidak lagi
   ditampilkan.".
7. "Batalkan" of an approved sharing says "Permintaan dibatalkan.", as in
   the prototype.
8. Stopping always wins: a withdrawal by the student, and "Batalkan" or
   "Tarik publikasi" by Konselor, are kept even when the sharing changed
   since the screen showed it, as long as it is still the same sharing
   and still current. Any other press on a sharing that changed is
   refused and the current status shows.
9. Each request is its own record, kept for good with its log; a new
   request after "Ditolak", "Ditarik" or "Dicabut" is a new record. Its
   data, recipients and summary are fixed once asked.
10. The rule that decides what a recipient may see is built: only a
    "Dipublikasikan" sharing, and only by the recipients ticked on it.
    The recipients' screen itself is not built.
11. Pengasuh and Ketua Program Studi are written "(hanya pengasuh
    mahasiswa ini)" and "(hanya ketua prodi mahasiswa ini)", as in the
    prototype; Kepala Unit is written with its full title, "Kepala Unit
    Pembangunan Karakter".
12. The summary may hold at most 1000 letters.
13. The student sees "Persetujuan berbagi data diberikan kepada
    (recipients)" while approved, and "Data dibagikan kepada
    (recipients)" once published, both with "Cabut persetujuan berbagi",
    as in the prototype. After it is stopped or declined, the box shows
    nothing more.

## Steps

- [x] 1. The tables for sharing and its log are added, with made-up
  sharings in every status.
- [x] 2. The rights to ask and publish (Konselor) and to answer
  (Mahasiswa) are added to the permission list, with their checks.
- [x] 3. Konselor asks for approval in "Publikasi data kesehatan mental".
- [x] 4. The student approves, declines or withdraws on Konseling;
  withdrawing the consent to counselling stops the sharing too.
- [x] 5. Konselor publishes, records a paper approval, cancels or
  withdraws.
