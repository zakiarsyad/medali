# Dorm clarification from a student who no longer lives in the dorm

Depends on: Asrama: Dorm attendance clarification, Asrama: Dorm residents
and rooms
Group: Asrama

## What we want

Only students who live in the dorm may ask for a dorm attendance
clarification. After Pengelola Asrama makes a student "Non asrama" on
Ploting kamar, the student's Asrama menu is gone. The clarification action,
sent by hand, still accepts a new one for a past dorm absence: it answers
"Klarifikasi terkirim." and BAM - BPHK then sees it on Klarifikasi
kehadiran, marked "Tidak tinggal di asrama", with "Terima, teruskan ke
pengelola". Leave requests, return reports and advokasi already refuse a
student who does not live in the dorm.

## Who it is for

- A student who no longer lives in the dorm.
- BAM - BPHK, BAM - KI and Pengelola Asrama, who should not get a new
  clarification from them.

## What should happen

- When a student who does not live in the dorm sends a dorm clarification,
  also by hand, then it is refused with "Klarifikasi asrama hanya dapat
  diajukan oleh mahasiswa yang tinggal di asrama." and nothing is saved.
  Confirmed by a check.
- When a resident sends one, then nothing changes: it is saved as today.
  Confirmed by a check.
- When a clarification was sent while the student still lived in the dorm,
  then it stays as it is today, after the move.

## Not included

- What happens to clarifications that were already sent before the move.
- Other dorm flows, which already check where the student lives.

## Better than the prototype

- Nothing new. The prototype only offers the button to residents. This
  makes the server agree.

## Decided

1. The message uses the same words as the refused leave request, "…
   hanya dapat diajukan oleh mahasiswa yang tinggal di asrama."
2. Where the student lives is read for the day the clarification is sent,
   as for a leave request and a return report, not for the day of the
   absence: a student made Non asrama after the absence may no longer ask.
3. The check comes after the form's own checks, as for a leave request, so
   a form with a missing part still says what is missing first.
4. A student who lives in no dorm and sends again an absence whose
   clarification still waits is refused too, rather than told it was sent:
   the waiting one stays as it is, and nothing new is saved.

## Steps

- [x] 1. The dorm clarification action refuses a student who does not live
  in the dorm, with checks for a non-resident and a resident.
