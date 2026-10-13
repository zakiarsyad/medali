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

## Decisions made while building

5. A survey period is stored as one record: its Periode, the two dates,
   the weight of capaian karakter, the note, who opened it and when,
   and, when it was closed by hand or cancelled, who did that and when.
   The weight of umpan balik is not stored: it is always the rest of
   100. A period is never erased, and the database itself refuses to
   delete one.
6. A period runs while it is Terjadwal or Dibuka: it is not cancelled,
   not closed by hand, and its last day is today or later. The database
   itself refuses a second period while one runs, and refuses to give a
   period that is over a later last day while another runs. It decides
   by the day on campus. Two that arrive at the same moment wait for
   each other, so the second is refused. A period that is past its last
   day, closed by hand or cancelled stands in nobody's way.
7. The database also refuses a last day before the first day, a weight
   outside 0 to 100, a close or a cancel without who and when, and a
   period that is both closed by hand and cancelled. A period of one
   day is allowed.
8. The sample period is of the academic period before the running one,
   as in the prototype: three weeks that start 60 days before that
   period ends, which is 1 to 21 June for a Genap period, with weights
   of 50 and 50 and the note "Data contoh periode lalu.". The sample
   Kepala Unit opened it four days before its first day and closed it
   by hand on its last day, so it shows as Ditutup.
9. Opening a period, changing its last day, closing it and cancelling
   it are one new right, held by Kepala Unit only. The list of rights
   that Kepala Unit sees names it "Membuka, mengubah, menutup, dan
   membatalkan periode evaluasi oleh mahasiswa". Reading the tab needs
   no new right: whoever may open the tab reads it, which the list of
   pages already gives to Kepala Unit, Direktur / Wakil Direktur, Ketua
   Program Studi and Pegawai UPK, and to nobody else.
10. Periode offers the running academic period first, already chosen,
    then the one before it. The server reads both itself: any other
    Periode is refused with "Pilih periode dari daftar."
11. A first day before today is allowed, as in the prototype: the period
    is then Dibuka at once. Only the last day may not have passed. A
    period may start and end on the same day.
12. What is wrong is said in this order, one message at a time: the
    Periode, then "Isi tanggal dibuka dan tanggal ditutup dengan tanggal
    yang benar.", "Tanggal ditutup tidak boleh sebelum tanggal dibuka.",
    "Tanggal ditutup sudah lewat. Pilih hari ini atau tanggal
    sesudahnya.", "Isi bobot capaian karakter dengan bilangan bulat 0
    sampai 100.", and a Keterangan longer than 1,000 characters, the
    length of the other notes of this menu. What was typed stays in the
    form.
13. A weight that is not a whole number of 0 to 100 is refused, never
    brought into range as the prototype does. While the first weight
    holds no such number, the second field is empty.
14. The question "Periode (periode) sudah pernah dibuka. Buka lagi
    sebagai periode baru?" is asked when a period of that Periode exists
    that was not cancelled, as the prototype does. Unlike the prototype
    the sample period counts, so the question can be tried by choosing
    the earlier Periode. The screen asks it; the server opens a period
    without it, because a second period of one Periode is allowed.
15. A second period while one runs is refused with "Masih ada periode
    evaluasi yang terjadwal atau dibuka. Tutup atau batalkan periode itu
    dulu, lalu buka periode baru."
16. After opening, the message reads "Periode evaluasi (periode) dibuka.
    Mahasiswa dapat mengisi survei di Profil saya." For a period that
    starts later it reads "Periode evaluasi (periode) dijadwalkan.
    Mahasiswa dapat mengisi survei di Profil saya mulai (date)."
17. Opening a period takes the form away, and closing or cancelling one
    brings it back. What such a step did is said above whichever of the
    two shows, until the next change, as Penetapan angkatan baru does.
18. "Komponen evaluasi pengasuhan" is worded as in the prototype: the
    two parts, then how they are joined into Nilai evaluasi, with the
    eight statements folded under "Pernyataan survei (8)". Its last
    sentence speaks of results that are fixed, which come with "Student
    survey results".
19. The tab's screen parts, its form checks and its saves stand with the
    other tabs of the Pengasuh menu. Which survey period runs on a day
    is kept with the shared mentoring rules, because Profil saya will
    read it too.

## Steps

- [x] 1. Survey periods are stored, one running at a time, with one
  closed sample period.
- [x] 2. The permission to manage periods, with its checks.
- [x] 3. The tab with the open form and "Komponen evaluasi pengasuhan".
- [ ] 4. The running period card with its status by date.
- [ ] 5. Changing the end date, closing now and cancelling.
- [ ] 6. Read-only view, double press and the phone layout.
