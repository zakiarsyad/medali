# Dorm referrals for Konselor

Depends on: Counselling consent, Voluntary counselling registration, Mental health early marker
Group: Konseling

## What we want

BAM - Kesehatan may mark a dorm resident as "Potensi: perlu dirujuk ke
konselor", from what they observe. Konselor sees these marks as a list,
"Rujukan potensi kesehatan mental dari asrama", and follows each one up
by asking the student for consent. The dorm side never learns what
Konselor did with a referral.

## Who it is for

- Read and follow up: Konselor.
- The mark itself is made and seen on the Asrama side, by the roles
  "Mental health early marker" names. They see nothing of this list.

## What should happen

- When Konselor opens Konseling, then they see "Rujukan potensi kesehatan
  mental dari asrama" with the note "Penanda awal dari BAM - Kesehatan
  berdasarkan pengamatan, bukan hasil asesmen", the number of referrals,
  and one row per student marked "perlu dirujuk": name, NIM, program
  studi, Kamar, Pengamatan, and "Ditandai" (date and who).
- When there is none, then it says "Tidak ada rujukan dari asrama."
- When they look at a row, then it also shows the student's
  "Persetujuan" status and whether a schedule is active, so they know
  what is already under way.
- When they press "Tindak lanjuti", then "Persetujuan konseling" shows
  that student, ready for "Kirim permintaan persetujuan".
- When a writer of the mark (BAM - Kesehatan or Kepala Unit) changes it
  to "perlu pemantauan" or "Tidak ada indikasi", then the row is gone
  on the next load.
- When a student is marked only "perlu pemantauan", then they are not in
  the list.
- When BAM - Kesehatan, Pengelola Asrama, Pengasuh or Kepala Unit sends a
  hand-made request for this list, or for a referred student's consent,
  schedule or sessions, then the server refuses it. The student does not
  see that they were referred. Confirmed by a check.
- When a mark is removed while Konselor presses "Tindak lanjuti", then
  the consent panel still opens for that student and the row is gone on
  the next load. Confirmed by a check.
- When opened on a phone, then each row becomes a card with no sideways
  scroll.
- When the list is long, then it loads 20 rows at a time, newest first,
  within about 1 second on the preview.

## Not included

- Making, changing and seeing the mark on Asrama > Kesehatan (Mental
  health early marker).
- Screening the student (Mental health screening). The prototype's
  "Tindak lanjuti" led to the screening form.
- Telling the dorm what happened next.
- Marking a referral as handled: the prototype has no such button; a
  row leaves the list only when the dorm changes its mark.

## Better than the prototype

- The list is on Konseling and leads to the consent request, which must
  come before anything else.
- Each row shows what is already under way, so one student is not
  followed up twice.
- The list is paged and has an empty state.

## Decided

1. Konselor may not mark a referral as handled, as in the prototype; the
   columns "Persetujuan" and the active schedule show what is under way.
2. The student is not told they were referred; they learn of it when
   Konselor asks for their consent.
3. Only dorm residents are referred this way, as in the prototype; other
   roles use Mandatory counselling.
4. Konselor gets one new right, to read dorm referrals. It shows only
   residents whose current mark is "Potensi: perlu dirujuk ke konselor",
   with only the fields listed above; it gives no access to the
   Asrama > Kesehatan tab, its numbers or its change log.
5. "Newest first" goes by the date the mark was last set. "Ditandai"
   shows that date and the name of the account that set it.
6. The line under "Potensi kesehatan mental" on Asrama > Kesehatan, which
   names who sees the mark, now names Konselor too, since the mark now
   reaches them. Nothing else on the Asrama side changes.

## Steps

- [x] 1. The right to read dorm referrals is added for Konselor only,
  with its checks, and made-up marks for sample residents.
- [ ] 2. "Rujukan potensi kesehatan mental dari asrama" shows the rows,
  the number and the empty state.
- [ ] 3. Each row shows consent and schedule, and "Tindak lanjuti" opens
  the consent panel.
