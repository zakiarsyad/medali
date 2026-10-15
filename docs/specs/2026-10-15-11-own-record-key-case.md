# Own-record check for calls and SPs holds for a student key in capitals

Depends on: Dorm warning letters
Group: Asrama

Urgent: a security hole on the merged app; a Pengelola Asrama who lives
in the dorm can schedule their own clarification call and issue their
own SP.

## What we want

A Pengelola Asrama may not schedule a clarification call or issue an SP
on their own record. The server checks this by comparing the student sent
by the browser with the account's own student, as plain text. A student
key is accepted in capital letters too, and the database finds the same
student either way. So a Pengelola Asrama who is also a dorm resident can
send their own key in capitals and get past the check: pick the time and
place of their own call, write their own "Hasil klarifikasi" and SP 2
proposal note, and issue their own SP 1 or SP 2. The check must hold
however the key is written.

## Who it is for

- Pengelola Asrama who are also dorm residents, who must not handle their
  own case.
- The other Pengelola Asrama, who handle it instead.

## What should happen

- When a Pengelola Asrama sends a hand-made request to schedule a call or
  issue an SP for their own record, with their student key in capital
  letters or mixed case, then the server refuses it with the same message
  as for the key in small letters, and nothing is saved. Confirmed by a
  check.
- When a Pengelola Asrama opens "Proses" for their own record through the
  address with their key in capital letters, then the box does not open,
  the same as with small letters. Confirmed by a check.
- When a Pengelola Asrama schedules a call or issues an SP for another
  resident, with that resident's key in any case, then it works as today.
  Confirmed by a check.

## Not included

- Any change to who may schedule calls or issue SPs, or to the call and
  SP screens.
- Reducing violations: that has its own check.

## Better than the prototype

- Nothing new. The prototype has no server; this closes a gap in the
  merged checks.

## Decided

- The key sent by the browser is made lower case before any comparison
  with the account's own student, the same way the reduction of
  violations already does.
- A student key read from the address of the staff violations screen is
  made lower case when it is read, so "Proses" and every other part of
  that address work on the one written form of the key.

## Steps

- [x] 1. The own-record checks for scheduling a call, issuing an SP and
  opening "Proses" hold for a student key in any case, with checks for
  capitals.
