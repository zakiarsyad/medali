# Mandatory counselling from a discipline penalty

Depends on: Recording a discipline penalty; Mandatory counselling
Group: Pembinaan

## What we want

From the "Rincian" of a discipline penalty, Pembina Disiplin Mahasiswa
sends the student to mandatory counselling ("Tugaskan konseling wajib").
This makes an assignment of the kind "Penugasan", which Mandatory
counselling brings, in Konselor's "Jadwal konseling", waiting for a time.
Pembinaan then shows the sender only how far the request has come, never
what was said in the session.

## Who it is for

- Send, and see that it was sent with its status, date and Jam: Pembina
  Disiplin Mahasiswa only.
- Konselor and the student pick it up on Konseling.
- The other roles that read the penalty (Kepala Unit, Direktur / Wakil
  Direktur, Ketua Program Studi, Pengasuh) see nothing about the
  counselling.

## What should happen

- When Pembina Disiplin Mahasiswa opens "Rincian" of a penalty with no
  counselling yet, then they see "Tugaskan konseling wajib" with the field
  "Pesan untuk konselor (opsional)" and the button "Tugaskan konseling".
- When they press the button and confirm, then a message says "Konseling
  wajib ditugaskan kepada (name)", and the box now shows "Konseling
  wajib", the status "Menunggu jadwal", when and by whom it was sent, and
  "Isi sesi konseling hanya diketahui konselor."
- When it is sent, then Konselor finds a new request in "Jadwal
  konseling" with the kind "Penugasan", the topic "Pelanggaran disiplin",
  "Dasar" holding only the penalty's Kategori and Jenjang, never the
  Uraian, and the message. From there on it follows Mandatory
  counselling.
- When Konselor sets a time, finishes, or marks the student absent, then
  the box in "Rincian" shows the new status, and the date and Jam once
  there is one. Nothing else from Konseling shows here.
- When a penalty already has a counselling request, then the button is
  not shown; a hand-made second send is refused with "Sudah ditugaskan".
  Confirmed by a check.
- When Kepala Unit or a reading role opens "Rincian", then they see no
  button and no status box. When they ask by hand for the request, its
  status or its time, then it is refused. Confirmed by a check.
- When any role other than Pembina Disiplin Mahasiswa sends a hand-made
  request, or it names a penalty outside the sender's rows or a student
  other than the penalty's own, then the server refuses it. Confirmed by
  a check.
- When the button is pressed twice, or two people send for the same
  penalty at once, then one request exists. Confirmed by a check.
- When a request is sent, then a line goes to the counselling schedule's
  log: who, when, "Menugaskan konseling wajib". Confirmed by a check.
- When "Rincian" is opened on a phone, then the message field and the
  button stack with no sideways scroll.
- When the button is pressed on the preview, then the status box replaces
  it within about 1 second.

## Not included

- What Konselor and the student do with the request: setting the time,
  asking for another time, the outcome, the session notes. Those are in
  Mandatory counselling.
- The call to counselling from Penilaian > Asesmen karakter
  ("Pemanggilan", in Students needing coaching).
- Sending from a note in Catatan pelanggaran; the prototype offers it
  only on a discipline penalty.
- Sending by Kepala Unit, and taking a request back or cancelling it: the
  prototype has neither.

## Better than the prototype

- Sending asks for confirmation, because it commits the student to a
  mandatory session.
- "One request per penalty" is kept by the server, not only by hiding
  the button.
- The student named in the request always comes from the penalty, not
  from the screen.
- Konselor is sent Kategori and Jenjang only, and only the sender sees
  the status box; the prototype sent the Uraian and showed the box to
  every role that reads the penalty.

## Decided

1. Konselor sees only the Kategori and Jenjang, plus the message the
   sender chooses to write.
2. Only Pembina Disiplin Mahasiswa sends, not Kepala Unit, as in the
   prototype.
3. Nobody takes a request back or cancels it.

## Steps

- [ ] 1. The right to send a student to mandatory counselling, and to
  read the status, date and Jam of these requests, is added for Pembina
  Disiplin Mahasiswa, with its checks.
- [ ] 2. An assignment of the kind "Penugasan" (from Mandatory
  counselling) can point to one discipline penalty, with samples.
- [ ] 3. "Tugaskan konseling wajib" in "Rincian", with confirmation.
- [ ] 4. The status box for Pembina Disiplin Mahasiswa only.
- [ ] 5. One request per penalty, also when sent twice at once.
