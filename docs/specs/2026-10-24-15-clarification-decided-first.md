# Tell Pengelola Asrama when a clarification was already decided

Depends on: none
Group: Asrama
Kind: fix, found by "Audit: Profil saya and Tugas saya"

## What we want

Pengelola Asrama can decide one dorm attendance clarification on Tugas
saya and on Klarifikasi kehadiran asrama. When the same clarification
is decided on both pages at the same moment, the first decision is
kept and the second is refused, which is right. But on Klarifikasi
kehadiran asrama, filtered on "Diverifikasi BAM" (the filter that
Tugas saya's link opens), the refused decision gives no message: the
card just disappears, as it does after a kept decision. So the person
cannot tell their choice was not saved.

Leave requests, return reports and cleaning assessments already tell
the loser, for example "Izin ini sudah disetujui lebih dulu, jadi
keputusan Anda tidak disimpan."

Cause: the page is redrawn after every decision of Pengelola Asrama,
also a refused one, so the card that carries the message is removed
before the message shows. The leave, return and cleaning decisions
redraw only after a kept decision.

## Who it is for

Pengelola Asrama, on Klarifikasi kehadiran asrama and on Tugas saya.

## What should happen

- When a clarification was already decided by someone else and
  Pengelola Asrama decides it again on Klarifikasi kehadiran asrama,
  under any filter, then the page says it was already decided and
  their decision is not saved, as the other dorm decisions do.
- When the same happens on Tugas saya, then Tugas saya also says so.
- When a decision is kept, then the card leaves the list as today, the
  number beside Tugas saya in the menu falls at once, and the success
  message shows as today.
- The first decision stays as it was; nothing else changes.

## Not included

- Who may decide a clarification, or what the decisions do.
- BAM's verification step.

## Decisions

1. The message for the refused decision is the one the server already
   gives for this case, shown where the other dorm decisions show
   theirs.
2. The page is redrawn only after a kept decision, as for leave,
   return and cleaning.
3. Decided while building: on Klarifikasi kehadiran asrama the refused
   card stays, with its buttons, and says under them "Klarifikasi ini
   sudah diputuskan oleh petugas lain. Muat ulang halaman.", as a
   refused leave decision stays on its card. On Tugas saya the item
   leaves the list and its section says "Sudah diproses. Daftar
   diperbarui.", which Tugas saya already says for every item decided
   elsewhere first; that case was already met there and is kept.
4. Decided while building: any other refusal of Pengelola Asrama's
   decision, such as a rejection without a note, no longer redraws the
   page either. Nothing changed, so there is nothing to redraw.

## Steps

- [x] 1. A refused decision of Pengelola Asrama on a clarification no
  longer redraws the page, with a check.
