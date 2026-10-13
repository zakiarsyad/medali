# Student survey period

Depends on: Mentor groups, Academic period
Group: Pengasuh

## What we want

The Pengasuh menu gets the tab "Evaluasi oleh mahasiswa", with its
first part: Kepala Unit opens a period during which students rate their
mentor in a satisfaction survey. The period has a start and an end date
and the weights of the two parts of the result. Only one period runs at
a time.

## Who it is for

- Open, change, close and cancel a period: Kepala Unit.
- Read: Direktur / Wakil Direktur, Pegawai UPK and Ketua Program Studi.

## What should happen

- When Kepala Unit opens the tab with no period running, then they see
  "Buka periode evaluasi pengasuhan": Periode, Tanggal dibuka (today),
  Tanggal ditutup (14 days later), Bobot capaian karakter (%) (50),
  Bobot umpan balik mahasiswa (%) (always the rest of 100), Keterangan
  untuk mahasiswa (optional); and beside it "Komponen evaluasi
  pengasuhan", which explains the two parts and lists the eight survey
  statements.
- When they press "Buka periode evaluasi" with valid data, then the
  message says the period is open and where students fill in the
  survey, and the form gives way to "Periode evaluasi (periode)" with
  its dates, who opened it, the status, Responden and Bobot. Responden
  shows "0 dari (n)" until answers exist; they come with "The survey
  form on Profil saya".
- When a date is missing, the end is before the start, the end has
  passed, or the weight is not 0 to 100, then nothing is saved and the
  message says why.
- When the same Periode was opened before, then they are asked "sudah
  pernah dibuka. Buka lagi sebagai periode baru?" first.
- When the start date is later than today, then the status is Terjadwal;
  between the dates Dibuka; after the end Berakhir; closed by hand
  Ditutup. The status changes by itself with the date.
- When a period is Terjadwal or Dibuka, then a second one cannot be
  opened: the open form is not offered, and a hand-made request is
  refused. Confirmed by a check.
- When they change "Ubah tanggal ditutup" and press "Simpan tanggal",
  then the end date changes; a date before the start is refused.
- When they press "Tutup periode sekarang" and confirm, then the status
  is Ditutup and students can no longer answer.
- When they press "Batalkan periode" and confirm, then the period is
  gone from the screen and the form returns. The period is kept as a
  record marked cancelled, with who and when.
- When a read-only role opens the tab, then they see "Periode evaluasi
  pengasuhan dibuka oleh Kepala Unit Pembangunan Karakter.", the running
  period without buttons, and "Komponen evaluasi pengasuhan".
- When any role but Kepala Unit sends an open, change, close or cancel,
  then the server refuses it. Pengasuh and Mahasiswa cannot open the
  tab. Confirmed by a check.
- When "Buka periode evaluasi" is pressed twice, then one period is
  opened.
- When the tab opens on a phone, then form and explanation stack with no
  sideways scroll; on the preview it shows within about 1 second.

No case was met on `main` before this spec: the tab had a name in the
menu and no screen. All of it is built here.

## Not included

- The survey form for students (The survey form on Profil saya).
- "Hasil evaluasi per kelompok" and fixing the results ("Student survey
  results").
- The count of answers in the cancel question, and marking the
  answers of a cancelled period: they come with the answers (The
  survey form on Profil saya).
- The 14 days and the weights of 50 and 50 are the prototype's values,
  to be confirmed by the campus before launch.

## Better than the prototype

- An end date that has already passed is refused.
- A double press opens one period, and the one-at-a-time rule is kept
  by the database, not only by the screen.
- A cancelled period is kept as a marked record instead of being
  hidden.

## Decided

1. The periods that can be chosen are the running academic period and
   the one before, both read from "Academic period".
2. The weights cannot be changed after the period opens; cancel and
   open again.
3. The eight statements are fixed for now, shown as they are in the
   prototype; editing them would be a later spec.
4. "Responden" on this card is counted from all active students with a
   group; students on Cuti are left out.

## Steps

- [ ] 1. Survey periods are stored, one running at a time, with one
  closed sample period.
- [ ] 2. The permission to manage periods, with its checks.
- [ ] 3. The tab with the open form and "Komponen evaluasi pengasuhan".
- [ ] 4. The running period card with its status by date.
- [ ] 5. Changing the end date, closing now and cancelling.
- [ ] 6. Read-only view, double press and the phone layout.
