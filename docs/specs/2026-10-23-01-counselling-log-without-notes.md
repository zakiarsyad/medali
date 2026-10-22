Depends on: nothing beyond what is merged
Group: Konseling
Kind: fix, found by "Audit: Konseling"

## What we want

Counselling session notes are for Konselor alone, and "Audit: Konseling"
asks that the log of counselling records holds no note text. Today each
time Konselor saves a session with "Simpan sesi" or changes one with
"Ubah", the log line keeps the whole session before and after, notes
included. Every version of every note is copied into a log that can never
be changed or removed. After this work the log still says who did what and
when, and what changed, but never the words of a note.

Seen in "Audit: Konseling", on a local computer with sample data, as
Konselor: a session was saved with notes holding a made-up word, then
changed to another made-up word. The session log then held both words,
once in the "after" of the write line and again in the "before" and
"after" of the change line. The sample log lines on `main` hold the sample
notes in the same way. No screen shows this log, so no role reads it
today.

## Who it is for

Konselor, who writes the notes; Mahasiswa, whose notes they are.

## What should happen

- When Konselor saves a new session, then a line goes to the log with
  who, when, and the date, Jenis, Topik utama, Tindak lanjut and Sesi
  berikutnya, and says that notes were written, without their words.
- When Konselor changes a session with "Ubah", then the line holds the
  date, Jenis, Topik utama, Tindak lanjut and Sesi berikutnya before and
  after, and says whether the notes changed, without their words.
- When the notes did not change, then the line says they did not.
- The session itself still holds its notes, and "Riwayat sesi" and
  "Rincian" show them to Konselor as today.
- The made-up sessions of the sample data write log lines of the new kind.
- A check saves and changes a session with a made-up word in the notes,
  then finds that word in no log line.
- The rule in `docs/BUILDING-RULES.md` under "Data and safety" about
  logging before and after says that the text of a counselling note is
  never copied into a log; the log says only that it changed.

## Not included

- The log of note readings: it already holds who, whose and when only.
- The sharing log: it keeps the summary written for recipients, which the
  sharing spec asks for.
- Changing or removing log lines already written: the log cannot be
  changed, and on `main` they hold sample notes only.
- A screen that shows the log.

## Decided

1. What does a log line say about the notes? Only whether they were
   written or changed, with no length and no part of the text. Of two ways
   for personal data, this one shows less.
2. What about log lines already written? They stay as they are. The log
   cannot be changed, and until the app runs on the campus server they
   hold sample data only.
3. Where the line says it: the "after" of each line says of the notes
   "written" for a new session, and "changed" or "unchanged" for a change.
   The "before" of a change holds the other five parts only. No new table
   or column is needed. Decided by the builder.

## Steps

- [ ] 1. Session log lines keep every field but the notes, and say whether
  the notes were written or changed; the sample data and the rule in
  `docs/BUILDING-RULES.md` follow.
