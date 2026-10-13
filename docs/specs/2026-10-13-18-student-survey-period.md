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
20. Only a period that runs has a card, as in the prototype. When the
    latest period is Berakhir or Ditutup, Kepala Unit sees the form to
    open a new one, and the other roles see no period. A period that is
    over shows again with "Student survey results".
21. The status is decided from the two dates and the mark of a close by
    hand, on the day on campus. Nothing is stored for it. This rule is
    kept with the shared mentoring rules too.
22. Responden reads "0 dari (n)" without the percentage the prototype
    adds: a share of nothing says nothing, and it comes with the
    answers. (n) counts the Aktif students of the groups in force.
    Ketua Program Studi sees the count of their program's groups only,
    as the prototype does and as their other screens do; one without a
    program sees 0.
23. Under the heading the card reads "(first day) sampai (last day) ·
    dibuka oleh (name)", as in the prototype. Bobot reads "Capaian 50% ·
    umpan balik 50%". Keterangan shows only when the period has one.
    Dibuka and Terjadwal have the colours the prototype gives them.
24. "Ubah tanggal ditutup" refuses a day before the first day and, as
    when opening, a day that has passed, each with the message the form
    uses. Today is accepted: the period stays Dibuka until the day is
    over. To end a period at once there is "Tutup periode sekarang". A
    date that is missing or does not exist gets "Isi tanggal ditutup
    dengan tanggal yang benar." After a save the message reads "Tanggal
    ditutup diubah menjadi (date)."
25. "Tutup periode sekarang" asks "Tutup periode evaluasi sekarang?
    Mahasiswa tidak dapat mengisi survei lagi." The period keeps its
    dates and gets the mark of who closed it and when; the prototype
    moves the last day to today instead. A Terjadwal period can be
    closed too, as in the prototype. The message reads "Periode evaluasi
    ditutup. Mahasiswa tidak dapat mengisi survei lagi."; what the
    prototype says there about capaian karakter belongs to "Student
    survey results".
26. "Batalkan periode" asks "Batalkan periode ini?", and then says
    "Periode evaluasi dibatalkan."
27. Only a period that runs can get another last day, be closed or be
    cancelled. A period that is Berakhir or Ditutup cannot be cancelled
    and cannot be opened again by a later date. A request that comes too
    late, such as a second press or one from another window, is told
    "Periode evaluasi ini sudah tidak berjalan: sudah ditutup,
    dibatalkan, atau berakhir. Muat ulang halaman, lalu periksa lagi."
28. Under the buttons stands "Hanya satu periode evaluasi yang dapat
    dibuka pada satu waktu.", without the prototype's second sentence
    about the results table, which is not built here.
29. Nothing here stops a student from answering, because there is no
    survey form yet. That form will ask which period runs, and a period
    that is closed, cancelled or past its last day does not.
30. A role that only reads sees the line "Periode evaluasi pengasuhan
    dibuka oleh Kepala Unit Pembangunan Karakter." above the two panels,
    where the sibling tab puts its own such line; the prototype puts it
    inside the panel. While no period runs, such a role sees the line
    and "Komponen evaluasi pengasuhan" only. It sees who opened the
    running period, as the prototype shows.
31. When "Buka periode evaluasi" reaches the server twice at the same
    moment, one period is opened and the second is told that a period
    still runs, also when the two ask for different dates or another
    Periode. A second "Tutup periode sekarang" or "Batalkan periode",
    and a cancel that arrives while a close is on its way, is told the
    period runs no more, and the record keeps who did it first. On the
    screen every button of the panel is off while a change is on its
    way.
32. On a phone the panel of the period comes first and "Komponen
    evaluasi pengasuhan" under it. The status drops under the heading of
    the card where the two do not fit on one line, and a long note folds
    inside the card.
33. The period, the number of students who can answer and what the form
    opens with are read at the same time. On a local computer the tab
    answered in about 0.1 second for each of the four roles.
34. A date of the year 0000 is not a date: the database has no such
    year and cannot keep it. A hand-made request with such a first day
    used to end in a server error without a message. The check of a
    date that every form shares now refuses it, so here the answer is
    "Isi tanggal dibuka dan tanggal ditutup dengan tanggal yang benar."
    and nothing is saved. The other forms that ask for a date now
    answer such a date with their own message for a wrong date. The
    ones that were tried, mentor replacement and the PPKS schedule,
    refused it before as well. Periode akademik answers it with other
    words now: "Isi tanggal Mulai dan Selesai." instead of the message
    about the years 2000 to 2101.

## Steps

- [x] 1. Survey periods are stored, one running at a time, with one
  closed sample period.
- [x] 2. The permission to manage periods, with its checks.
- [x] 3. The tab with the open form and "Komponen evaluasi pengasuhan".
- [x] 4. The running period card with its status by date.
- [x] 5. Changing the end date, closing now and cancelling.
- [x] 6. Read-only view, double press and the phone layout.
