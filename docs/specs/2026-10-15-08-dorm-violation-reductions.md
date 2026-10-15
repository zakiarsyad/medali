# Dorm violation reductions

Depends on: Dorm warning letters, Academic period
Group: Asrama

## What we want

When a resident's explanation is accepted, Pengelola Asrama takes a
counted violation off their record (Kurangi), with the reason written
down. The violation then leaves the announcement and no longer counts
towards an SP. Every reduction is listed and can be undone.

## Who it is for

- Reduce and undo: Pengelola Asrama.
- Read the list of reductions: Kepala Unit. BAM roles do not see it.
- Mahasiswa who live in the dorm, for their own record.

## What should happen

- When Pengelola Asrama opens a student under "Rekap pelanggaran per
  mahasiswa", then each violation at Naik ke Pengelola has the button
  "Kurangi".
- When they press it, fill "Dasar pengurangan (hasil klarifikasi yang
  diterima)" with 5 letters or more and confirm, then the violation
  leaves the student's count and "Pengumuman pelanggaran", and a message
  says so.
- When they open "Proses" for a called resident, then each counted
  violation has a tick "Kurangi", and the button reads "Kurangi (n)
  pelanggaran". Pressing it asks to confirm with the number left.
- When the count falls under what an SP needs, then the resident leaves
  the list of calls and the message says "Panggilan klarifikasi tidak
  lagi aktif"; otherwise it says the call is still active.
- When Pengelola Asrama or Kepala Unit opens the tab, then "Riwayat
  pengurangan pelanggaran" lists the student, the violation, the reason,
  who and when for the semester. With none it says "Belum ada
  pengurangan pada semester ini."
- When Pengelola Asrama presses "Batalkan" on a reduction and confirms,
  then the violation counts again and is back in the announcement.
- When the resident opens "Rekam jejak pelanggaran saya", then a reduced
  violation shows as "Dikurangi" with the reason and does not count.
- When any role but Pengelola Asrama sends a hand-made reduction or
  undo, or a BAM role or a resident asks for the list of reductions,
  then the server refuses it. A violation still in Masa advokasi or with
  an accepted appeal cannot be reduced. Confirmed by a check.
- When "Kurangi" is pressed twice, then the violation is reduced once.
  A reduced violation is marked, not deleted, and every reduction and
  undo adds a line to the change log. Confirmed by a check.
- When Pengelola Asrama reduces on a phone, then the ticks and the
  reason fit one column with no sideways scroll.
- When the tab opens on the preview, then it shows within about 1
  second, and the list of reductions is paged.

## Not included

- Withdrawing an SP that was already issued.
- Reducing a violation that never reached Pengelola Asrama.

## Better than the prototype

- The reason is asked in a form with a confirmation, not in a browser
  prompt.
- The record is kept and marked, so the history can always be trusted.
- The resident sees that a violation was reduced and why, instead of
  the row silently vanishing.

## Decided

1. The resident sees a reduced violation as "Dikurangi", with the
   reason, so they know the explanation was accepted.
2. A reduction may be undone after an SP decision was based on it. The
   count is worked out again; an SP already issued stays.
3. Only Pengelola Asrama and Kepala Unit read "Riwayat pengurangan
   pelanggaran"; never BAM roles or other residents.

## Steps

- [ ] 1. The reduction mark with its reason, who and when is added to
  dorm violations, with sample reductions.
- [ ] 2. The right to reduce is added to the permission list, with its
  checks.
- [ ] 3. Pengelola Asrama reduces one violation from the list per
  student.
- [ ] 4. Pengelola Asrama reduces several at once while processing a
  call.
- [ ] 5. The list of reductions shows, with undo.
- [ ] 6. Residents see a reduced violation in their record.
