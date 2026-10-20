# Mental health screening

Depends on: Counselling consent, Mentor groups
Group: Penilaian

## What we want

Penilaian gets the tab "Kesehatan mental". Konselor records the result
of a screening (DASS-21 or SRQ-20) for a student; the app works out the
level and the advice. Only Konselor sees a person's result. Other staff
see counts with no names. It is the most sensitive data in the app.

## Who it is for

- Record and read: Konselor (right "Kesehatan mental").
- One campus-wide count only, no names: Kepala Unit, Direktur / Wakil
  Direktur, Ketua Program Studi and Pengasuh, the four roles the
  prototype gives this tab to.
- No access: Penilai Mahasiswa, Pegawai UPK, Pembina Disiplin Mahasiswa,
  Pengelola Asrama, every BAM role and Mahasiswa.

## What should happen

- When anyone opens the tab, then the top shows "Keadaan darurat" with
  what to do and the number 119.
- When Konselor picks a student, "Tanggal asesmen" and "Instrumen", then
  DASS-21 asks three sums of 0–21 (Depresi, Kecemasan, Stres) and SRQ-20
  asks the number of "ya" answers, 0–20. The level and "Rekomendasi" show
  as they type.
- When Konselor picks a student whose consent to counselling is not
  "Disetujui", then the form says consent is needed first and "Simpan
  asesmen" cannot be pressed. A save sent by hand for such a student is
  refused. Confirmed by a check.
- When a DASS-21 result is worked out, then each sum is doubled and
  compared with: Depresi 10, 14, 21, 28; Kecemasan 8, 10, 15, 20; Stres
  15, 19, 26, 34, giving Normal, Ringan, Sedang, Berat or Sangat berat;
  the level is the worst of the three. Sums 6, 3, 8 give 12, 6, 16 and
  Ringan; sums 11, 5, 10 give 22, 10, 20 and Berat. Confirmed by a check.
- When an SRQ-20 result is worked out, then 6 or more is Sedang and 5 or
  fewer is Normal. Confirmed by a check.
- When "Ada indikasi pikiran atau tindakan menyakiti diri" is ticked,
  then the level is Sangat berat whatever the scores, with "Tindak
  lanjut krisis hari ini sesuai protokol kampus" and the mark "Risiko".
- When a level is shown, then the advice is, in order: "Tidak perlu
  tindak lanjut", "Psikoedukasi dan pemantauan", "Konseling", "Konseling
  segera, pertimbangkan rujukan ke psikolog klinis", "Konseling segera
  dan rujukan ke psikolog klinis atau psikiater".
- When Konselor presses "Simpan asesmen", then the message says "Asesmen
  (name) disimpan." A number outside its range, a date in the future or
  no student saves nothing and says why. "Catatan konselor (rahasia)" is
  kept with it.
- When Konselor looks at "Daftar mahasiswa", then each screened student
  shows Pengasuh, the last instrument and date, Tingkat, and Persetujuan;
  the most serious first, 25 a page, with search and the filters "Perlu
  konseling" (Sedang and above) and "Menunggu persetujuan". "Rincian"
  shows every screening with its scores, advice and note.
- When Konselor looks at the numbers, then they see Sudah diasesmen,
  Perlu konseling and Menunggu persetujuan.
- When Kepala Unit, Direktur, Ketua Program Studi or Pengasuh opens the
  tab, then they see "Sudah diasesmen" as a count for the whole campus,
  the same for all four, and the note that personal data shows only
  when Konselor publishes it with the student's consent. A count of 1
  to 4 shows as "<5"; the server sends no smaller number. No count per
  level shows here; where one shows (Dashboard mental health), a group
  under 5 shows "Rekap ditampilkan setelah minimal 5 mahasiswa
  diasesmen, agar identitas tidak dapat ditebak."
- When any role but Konselor asks by hand for a student's screening,
  scores, level or note, or sends a screening, then it is refused and
  nothing personal is sent. Penilai Mahasiswa, Pegawai UPK, Pembina
  Disiplin Mahasiswa, Pengelola Asrama, BAM roles and Mahasiswa have no
  access to the tab. Confirmed by a check.
- When "Simpan asesmen" is pressed twice, then one is saved. Saves and
  each opening of "Rincian" go into the log, without scores or notes.
  Screenings are never erased. Confirmed by a check.
- When used on a phone, then the form is one column and the list becomes
  cards. The tab shows within about 1 second on the preview.

## Not included

- Sharing a level with staff (Sharing the screening level). Session
  notes, consent and publication panels: they are in Konseling.
- "Rujukan potensi kesehatan mental dari asrama" (Dorm referrals for
  Konselor).
- The student's own result (My health on my profile).
- Cancelling or correcting a screening, and a link between the two
  "Daftar mahasiswa": the prototype has neither.
- The DASS-21 cut-offs, the SRQ-20 limit of 6 and the advice texts are
  the prototype's values, to be confirmed by the campus before launch.

## Better than the prototype

- A count of 1 to 4 shows as "<5", so it cannot point to a
  person. The list is paged and can be searched.
- Kepala Unit and Direktur can no longer read a result without consent.
- A screening is saved only for a student who agreed to counselling.

## Decided

1. Konselor records a screening only for a student whose consent to
   counselling is "Disetujui", the same consent as on Konseling.
2. A wrong screening is not corrected or erased: Konselor adds a new
   one, and the latest one counts for Tingkat in "Daftar mahasiswa".
3. The SRQ-20 limit of 6 is the same for men and women.
4. Konselor keeps two "Daftar mahasiswa", one on Konseling and one
   here, each with its own columns.

## Steps

- [x] 1. Screenings are stored, never erased, with made-up samples; the
  right "Kesehatan mental" is added for Konselor, with checks.
- [x] 2. The level and advice rules, with checks.
- [x] 3. The tab shows "Keadaan darurat", the numbers and "Daftar
  mahasiswa" with "Rincian" for Konselor.
- [x] 4. The screening form saves a result, only with consent
  "Disetujui".
- [ ] 5. Other staff see the campus count only, with the refusal checks.

