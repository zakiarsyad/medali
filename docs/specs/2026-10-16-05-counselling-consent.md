# Counselling consent

Depends on: nothing beyond what is merged
Group: Konseling

## What we want

The Konseling page gets its first content: the student's consent to
counselling ("Persetujuan konseling"). Konselor asks a student for
consent, or records a signed paper form. The student approves, declines
or later withdraws it on their own Konseling page. Session notes can be
written only while consent is given.

## Who it is for

- Ask and record: Konselor, for any student.
- Answer and withdraw: Mahasiswa, for themselves only.
- Nobody else sees that a consent exists or its status. Kepala Unit,
  Direktur / Wakil Direktur, Ketua Program Studi and Pengasuh have no
  Konseling page.

## What should happen

- When Konselor opens Konseling, then they see the notice "Keadaan
  darurat" with 119, and the panel "Persetujuan konseling" with a student
  search (name or NIM) and "Pilih mahasiswa untuk melihat status
  persetujuan" until one is picked.
- When Konselor picks a student with no consent yet, then the panel says
  "Belum diminta" and offers "Kirim permintaan persetujuan" and "Catat
  form tertulis yang sudah ditandatangani".
- When Konselor presses "Kirim permintaan persetujuan", then the status
  becomes "Menunggu" and a message says it was sent to that student.
- When Konselor presses "Catat form tertulis ..." and confirms, then the
  status becomes "Disetujui" with "Form tertulis", the date and their
  name.
- When the student opens Konseling while a request waits, then they see
  "Permintaan persetujuan konseling" with the full consent text of the
  prototype, and "Setujui" and "Tolak".
- When the student presses "Setujui" or "Tolak", then the status becomes
  "Disetujui" (with "Persetujuan daring") or "Ditolak", and the box shows
  it. Konselor sees the new status when they pick the student.
- When consent is "Disetujui", then the student sees "Cabut persetujuan";
  after they confirm, the status becomes "Dicabut".
- When consent is "Ditolak" or "Dicabut", then Konselor can send a new
  request.
- When the student opens Konseling with no waiting request, then they see
  their status ("Belum diminta" or the last answer with its date) and
  "Butuh bantuan segera?" with 119.
- When Kepala Unit or Pengasuh types the Konseling address, when a
  student sends an answer for another student or approves a consent that
  is not waiting, or when any role but Konselor sends a hand-made request
  to ask for, record or read a consent, then the server refuses it and
  gives nothing back. Confirmed by a check.
- When "Setujui" is pressed twice, or Konselor and the student act on the
  same consent at the same moment, then one change is kept and the other
  person sees the current status with a message. A student has at most
  one current consent. Confirmed by a check.
- When consent is asked, answered, recorded from paper or withdrawn, then
  a line goes to the log that cannot be changed: who, when, status before
  and after. Earlier answers are never erased. Confirmed by a check.
- When either page is opened on a phone, then the panels stack, the
  buttons fit, and nothing scrolls sideways.
- When Konselor searches a student on the preview, then at most 20
  matches show as they type, and the panel shows within about 1 second.

## Not included

- Session notes, scheduling and sharing (Counselling session notes,
  Voluntary counselling registration, Sharing a counselling summary).
- The mental-health screening and its results (Mental health
  screening).
- Taking back a request that is still "Menunggu": the prototype has no
  such button.

## Better than the prototype

- The student answers on Konseling, not in Profil saya, and Konselor asks
  on Konseling, not on Penilaian > Kesehatan mental: counselling is in
  one place for both.
- Recording a paper form and withdrawing ask for a confirmation.
- Two answers at the same moment cannot both win.

## Decided

1. The paper form keeps no scan of the signed form for now: only the
   date and who recorded it. A scan can be added later.
2. Konselor cannot take back a request that is still "Menunggu", as in
   the prototype; the request waits until the student answers.
3. While a request is "Menunggu", Konselor can still record a signed
   paper form, but not send a second request, as in the prototype.
4. A new request after "Ditolak" or "Dicabut" turns the student's one
   current consent back to "Menunggu"; the earlier answers stay in the
   log.
5. Konselor can search every student, whatever their status, because
   the issue says "for any student".
6. The messages are the prototype's: "Permintaan persetujuan dikirim ke
   (name).", "Persetujuan tertulis dicatat.", "Terima kasih. Konselor
   akan menghubungi Anda.", "Permintaan ditolak." and "Persetujuan
   dicabut.".
7. Session notes do not exist yet, so the rule that they need consent is
   built with Counselling session notes.

## Steps

- [x] 1. The tables for consent and its log are added, with made-up
  students in every consent status.
- [x] 2. The rights to ask for and record consent (Konselor) and to
  answer one's own (Mahasiswa) are added to the permission list, with
  their checks.
- [x] 3. Konselor's Konseling page shows the emergency notice and
  "Persetujuan konseling" with the request and the paper form.
- [ ] 4. The student's Konseling page shows the request, "Setujui",
  "Tolak" and "Cabut persetujuan".
