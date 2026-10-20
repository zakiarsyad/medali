# Building rules

Read this before writing or reviewing code. `CLAUDE.md` holds the rules
that apply to every session; this file holds the ones that only matter
while building.

## Where code goes

- `src/app/`: the screens and their addresses. Kept thin; the real work is
  in the features.
- `src/features/<area>/`: one folder per area of the app. It holds that
  area's rules, its database reads and writes, and its screen parts.
- `src/db/`: the table definitions and the changes to them.
- `src/academic-periods/`: the running academic period, how a period is
  named on screen, a student's semester and the tahap a semester belongs
  to, read by every area that needs them.
- `src/dorms/`: the four dorms, the rule for who lives in which, and a
  resident's room, read by every area that needs them.
- `src/mentoring/`: who is a mentee of a mentor today, which groups are
  in force, which members of a group are Aktif and how many it holds,
  how a list marks
  the students whose detail may be opened, the kinds and follow-ups of a
  mentoring note, how many meetings a period has with their marks and
  suggested topics, the range a mentoring score lies in, the reasons for
  replacing a mentor with what the old mentor becomes, which mentor a
  replacement set Tidak aktif, which mentor is kept for a replacement
  that waits for its date, whether an account holds a group today, how a
  replacement gives its group the new mentor, today or once its date has
  come, the wait that keeps two changes of who holds which group apart,
  the status a survey period has by its dates, which survey period runs
  on a day, and the statements, scale and limits of the survey, read by
  every area that needs them.
- `src/character-scores/`: the scores of a character assessment, their
  Rerata and predikat, how a Rerata and a predikat are shown, the medal
  chart, and each student's latest assessment and the one before it,
  read by every area that shows character scores.
- `src/character-grades/`: each student's semester character grade with
  its four parts, read from the areas each part belongs to, for every
  screen that shows the grade.
- `src/health-notes/`: the categories of a fitness test and of a health
  note, the limits in force and each student's latest score and note,
  the final category, how a note is checked, written, kept and shown,
  its form, and the list of sick students with its numbers, read by
  every area that keeps health notes.
- `src/clarifications/`: what a clarification of an absence takes, how
  its form and its file are checked, and how its file is shown, read by
  every area that takes clarifications.
- `src/auth/`: sign-in, the one list of what each role may do, and which
  students an account may see by it.
- `src/campus/`: what the campus server package checks and does when it
  starts.
- `src/ui/`: screen parts shared by more than one area.
- `docs/`: specs and lasting facts.

Rules:

1. One area does not reach into another area's files. What two areas both
   need moves to a shared place.
2. A rule that decides a score or a status is a plain function with no
   database inside it, so it is easy to test.
3. Only the server talks to the database and the file storage.
4. Take a thing from the file where it is defined, not through a file that
   only passes it along.

## Code

All code must be:

1. **Small.** Short functions that each do one thing, in small files. Make
   the smallest change that does the job.
2. **Reusable.** Before writing something new, look for something that
   already does it and use that. A shared piece lives in one place.
3. **Simple.** No clever logic. Use plain loops, named conditions and clear
   branches. Handle the unusual cases first and return early. If code needs
   a comment to be understood, rewrite it.
4. **Cheap to run.** It must run well on a small server and on free
   hosting. Ask the database only for what the screen needs. Long lists are
   loaded a page at a time. No paid service without the owner's OK.
5. **Tested.** Every rule that decides a score, a status, or who may see
   something has a test. A fix for a bug comes with a test that fails
   without the fix. A test sits next to the code it tests.
6. **Light on libraries.** Use what the project already has. Add a library
   only when it is truly needed: say why, and get the owner's OK first.
7. **Safe.** The server checks every request: who is asking, and whether
   their role may see or change this. Never trust what the browser sends.
   Check every input. No passwords or keys in the code. No personal data
   in logs or error messages.
8. **Clear for the user.** Screens are designed for a laptop first and
   must work well on a phone. When something goes wrong, the message says
   what happened and what to do next.

Also:

- Type checking stays at its strictest setting. Never loosen it to make
  code pass.
- Errors are never hidden. If something fails, say so clearly.
- A comment gives a reason the code cannot show. It does not repeat the
  code.
- Every colour, size, spacing and font is named once, in one place in
  `src/ui/`. Screens use only those names, never a loose value. Tests
  fail when a style file holds one, or when screen code sets a style or a
  colour directly.

## Data and safety

The rule about real people's data is in `CLAUDE.md`. These add to it.

1. Keys and passwords never go in the code or in the repo. They are set on
   the computer or the host that runs the app. The repo holds an example
   file with their names only.
2. Sensitive records are counselling, mental health, health and discipline.
   They are shown only to the roles allowed, and only after the student's
   consent where the rules ask for it.
3. Every change to a score, a discipline record, a counselling record or a
   person's role adds a line to a log: who changed it, what it was before
   and after, and when. The data itself can be corrected. The log cannot
   be edited or deleted, so it can always be trusted.
4. Those records are never truly deleted. A removal is a mark, with who
   and when.
5. Changes to database tables: Drizzle writes the change file, and Claude
   reads it before it is used. A change file that has been merged is never
   edited; a new one is added.
6. Anything that removes a table, a column or data needs the owner's OK
   first, asked in plain words.
7. No new table or column unless the spec needs it.
8. Do not state a fact about the data without checking it. Do not guess a
   number.
9. Uploaded files are checked for type and size. Only people allowed to
   see a record can open its files.

## Roles and permissions

1. There is one list of what each role may see and do, in `src/auth/`.
   Nothing else decides access.
2. A permission is a named action, such as "approve a leave request". Code
   asks "may this person do this action?". It never asks "is this person a
   mentor?".
3. The server checks on every request. Hiding a menu or a button is only
   for tidiness and never counts as protection.
4. Some roles see only part of the data: a mentor sees only their own
   mentees, a head of a study programme only that programme, a student
   only themselves. The server applies that limit when it reads the data.
5. One person can have several roles at once, for example a student who is
   also a BAM member, or a staff member who is both mentor and assessor.
   They may do everything that any of their roles allows. Never create a
   combined role to cover a mix. On each screen or action they see the
   rows of only those roles that allow it: a role that sees every
   student on its own screens adds no rows to another role's screen.
6. If the list does not say a role may do something, the answer is no.
7. Every permission has a test with a role that may and a role that may
   not. Another test checks that every screen and every action is in the
   list.
8. The app shows the list on a screen for the head of unit, built from the
   same list, so there is no second copy to keep up to date.
9. Changing what a role may do needs a spec and the owner's OK.
10. Sample data has at least one account per role. The "sign in as"
    shortcut exists only locally and on previews. The live app refuses
    to start with it turned on.
