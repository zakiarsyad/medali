# Leave cancelled by a student who no longer lives in the dorm

Depends on: Asrama: Dorm leave requests, Asrama: Dorm residents and rooms
Group: Asrama

## What we want

Only students who live in the dorm may ask for and cancel dorm leave. A
resident has an Izin pesiar that still waits (Diajukan). Pengelola Asrama
then makes the student "Non asrama" on Ploting kamar, so Perizinan asrama
refuses the student ("Akses ditolak"). But the "Batalkan" action, sent by
hand, still accepts the cancel: it saves the request as Dibatalkan. Asking
for leave already refuses a student who does not live in the dorm;
cancelling does not.

## Who it is for

- A student who no longer lives in the dorm.
- Pengelola Asrama, who decides the requests that still wait.

## What should happen

- When a student who does not live in the dorm cancels a leave request
  that still waits, also by hand, then it is refused with "Izin asrama
  hanya dapat dibatalkan oleh mahasiswa yang tinggal di asrama." and the
  request stays Diajukan. Confirmed by a check.
- When a resident cancels their own waiting request, then nothing
  changes: it is cancelled as today. Confirmed by a check.
- When the request of a student who moved out still waits, then
  Pengelola Asrama can approve or reject it as today.

## Not included

- What happens to leave requests that were already decided before the
  move.
- Other dorm flows, which already check where the student lives.

## Better than the prototype

- Nothing new. The prototype only offers the button to residents. This
  makes the server agree.

## Decided

1. The message follows the refused leave request: "Izin asrama hanya
   dapat dibatalkan oleh mahasiswa yang tinggal di asrama."
2. Where the student lives is read for the day the cancel is sent, as for
   asking for leave.
3. The check comes after the role check and before the request is looked
   up, as for asking for leave.
4. An account with no student behind it gets the same refusal, as when
   asking for leave. A key that is not a request key is still answered
   as a request that is not there, before where the student lives is read.

## Steps

- [x] 1. The leave cancel action refuses a student who does not live in
  the dorm, with checks for a non-resident and a resident.
