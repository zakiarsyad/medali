# MEDALI

Rules for working in this repo. They are written in plain words so that
anyone can read them, with or without a technical background.

## What to say to Claude

- **"Set up"** or `/set-up` gets a new computer ready: it installs what is
  missing and starts the app with sample data.
- **"Spec …"** or `/spec` starts a piece of work. Claude talks it through
  with you and writes a spec, until you say OK. No code is written.
- **"Build"** or `/build` makes everything in the approved spec. Claude
  builds it, reviews it, fixes what it finds, proves it works, and gives
  you a PR link and a preview link. You try the preview, and merge.
- **"Clean up"** or `/clean-up` tidies away finished work and stops what is
  running.

If you find a problem while trying the preview, describe it in plain words.
Claude fixes it in the same PR.

If GitHub says a PR is out of date or has a conflict, tell Claude. It
brings the PR up to date and sorts the conflict out.

## How work gets done

1. Every piece of work starts with a spec. No spec, no code.
2. A spec is one short file in `docs/specs/`, in plain words, one page at
   most. Its name is the date, a number for that day, and a short name:
   `2026-10-11-01-login.md`.
3. Claude writes the spec, shows it in chat, and waits for the owner's "OK"
   before building anything.
4. The spec is saved together with the code it describes.
5. Once all its steps are done, a spec is not changed again. A later change
   gets a new spec.
6. Scope is strict. Claude builds only what the approved spec says. An
   idea, a follow-up, a problem found elsewhere, or a discussion outside
   the spec is not done now. Claude suggests it as a new piece of work, in
   one line, at the end.
7. A spec delivers one feature that can be tried from start to finish on
   the preview, within one menu page, in about 8 steps at most. Work that
   cannot be tried that way is joined to the feature that needs it. A
   larger feature is split into features that can each be tried on their
   own.

### Facts that last

Specs are history: what one piece of work changed, and why. Facts that stay
true, such as the roles, the scoring rules and the fixed terms, live in
`docs/` and in this file. Update them when a piece of work changes them.
Keep each fact in one place.

A lasting file or a rules file has a plain name in capital letters that
says what it holds, with hyphens and no date: `BUILDING-RULES.md`,
`PROOF.md`. Only specs carry a date.

## The prototype

`docs/PROTOTYPE.html` is the first clickable version of the app. Use it as
the reference for screens, wording and behaviour. It is a very large file:
search it for the part needed, never read it whole. Do not copy its code;
build to the rules here.

## Changes and pull requests

A pull request (PR) is a proposed change waiting for approval. `main` is the
agreed version of the app.

### Making a change

1. Never change `main` directly. Each spec gets its own branch, named by
   kind: `feat/`, `fix/`, `refactor/` or `chore/`.
2. One PR per spec. Do not touch anything unrelated.
3. The PR is opened only when the whole spec is built, reviewed and fixed.
   It opens as a draft, and becomes ready once its checks pass and the
   approval comment is posted. Claude may push to a draft PR without asking
   first.
4. One commit per step of the spec, each covering one clear thing. Later
   fixes and merges of `main` add their own commits. A commit message is
   one sentence that names the thing and the change, starting with `feat:`,
   `fix:`, `refactor:`, `chore:`, `docs:` or `test:`.
   Example: `fix: refuse sign-in from addresses outside the campus`.
5. Commits, PR text and comments never mention Claude or any AI tool: no
   co-author line and no "generated with" footer.
6. To pick up new work from `main`, merge `main` into the branch. No rebase
   and no force push.
7. Push as seldom as possible. Every push makes the hosting build the app
   again, and the free plan allows a limited number of builds a day. Fixes
   after a PR is open are gathered, reviewed, and pushed together.

### PR description

Four short parts in plain words: what changed, why, how to try it on the
preview link for each role affected, and known gaps in this PR's own work.
No file lists and no checklists.

The PR title is written like a commit message, because it becomes the one
commit on `main` when the PR is merged.

### Finishing a PR

1. Claude reviews the change and fixes what it finds, until a review finds
   nothing more.
2. The PR is up to date with the latest `main`, and all checks pass.
3. Claude posts one comment, the approval comment, with two parts in this
   order:
   - the result of the review,
   - the proof: the preview link, and each case under "What should
     happen" in the spec, marked as confirmed on the preview or by a
     check.
4. Only then is the PR marked ready.
5. A new change after that puts the PR back to draft, and the approval
   comment is updated to match.
6. Claude never merges. The owner merges.

### Wording in PRs

Use lists. Use a table only to compare things side by side. No `#123` links
unless the link is the point.

## Working in parallel

More than one person may work on this repo at the same time.

1. Every branch starts from the latest `main`, never from another branch.
   No PR is built on top of another PR.
2. A spec that needs work which is not merged yet waits for it. Pick up a
   different spec in the meantime.
3. Each person works on a different spec, in a different area of the app.
4. A pushed branch that holds a spec is the claim on that work. Before
   writing a spec or building, check the branches and the open PRs. If one
   already covers the same area, stop and tell the owner.
5. When two PRs both change database tables, the second to merge takes in
   `main` first and remakes its table change. While both are open they
   share the PR preview database, so only the one deployed last has a
   working preview. To get it back, build the preview again from the
   hosting page, without a new push.
6. Only the owner merges, whoever made the PR.

## What the app is built with

- One app in one codebase, written in TypeScript. It serves both the
  screens and the data behind them.
- Next.js for the app.
- PostgreSQL for the database, with Drizzle to describe the tables and
  every change to them.
- Photos and other uploaded files go to file storage, not the database:
  MinIO locally and on the campus server.
- Sign-in is with Google, limited to campus addresses.
- Docker runs the database and the file storage on a local computer. Later
  it also packages the app for the campus server.
- `main` has one fixed preview link, and each PR gets its own, on free
  hosting: Vercel for the app, Neon for the database. Previews hold sample
  data only.
- There are two preview databases. One is for `main`, and only merged
  changes touch it. The other is shared by all PR previews, and is reset
  to sample data with the PR's tables each time a PR deploys.

## Building rules

Before writing or reviewing code, read `docs/BUILDING-RULES.md`. It covers
where code goes, the code rules, data and safety, and roles and
permissions. In short, code must be small, reusable, simple, cheap to run,
tested, light on libraries, safe, and clear for the user.

## Language

Words shown on screen are in Bahasa Indonesia. Everything else is in
English: code, database tables and columns, file names, specs, commits and
PRs.

## Real people's data

Sample data only, until the app runs on a campus server with a named unit
as its owner. Until then no real person's data goes anywhere: not on a
local computer, in a preview, in a test, in a spec, in a PR, or in a chat
with Claude.

## This repo is public

Anyone can see what is pushed here: code, specs, PRs, comments and preview
links. Before every push, check that it holds no key or password, no real
person's name or record, and no campus document that is not already
public.

## Review

A review checks a change before it is called ready. A fresh helper agent
does it, not the one that built the change, so nobody marks their own work.
It looks only at what the branch changes, and checks it against the spec and
the building rules. There are no review files: findings are shown in the
chat.

## Proof

Proof shows that a change works. It comes from really running the app,
never from describing it. The proof is the PR's preview link, with sample
data only: Claude confirms the change works there, and the owner tries it.
No pictures are taken as proof.

## Running the app on your own computer

1. The app and its checks run directly on the computer, with the Node.js
   version the repo names. The database and the file storage run inside
   Docker, so every computer has the same setup. One command starts the
   app. One command fills it with sample data. The checks also need the
   database running.
2. One piece of work at a time in one copy of the repo. Claude switches
   the repo folder to the branch being built, and back to `main` at clean
   up. To work on more than one piece at the same time on one computer,
   use one copy of the repo per piece, each with its own two databases:
   one for the app's sample data and one for the checks. A copy names
   them in its local settings file, as `DATABASE_URL` and
   `TEST_DATABASE_URL`, makes them with `pnpm db:create`, and removes them
   with `pnpm db:remove` when its work is done. A copy that names nothing
   uses the default two. All copies share the one Docker database and the
   one file storage.
3. Before switching branch, save unfinished work as a commit on its
   branch. Do not use `git stash`; work left there is easy to lose.
4. Never wipe a database unless that is the goal, and say so first.
5. Stop what you started when the work is done or when the owner says
   stop: apps, servers and Docker containers.
6. A local computer never connects to the live app or its data.

## Keeping Claude's work cheap

Claude's work is paid for by how much it reads and writes. Keep both small.

1. Search first, then read only the part of a file that is needed.
2. Do not read the same file or picture twice without a reason.
3. Take a screenshot only to check a visible problem. Look at each
   picture once.
4. While building, run only the checks for what changed. Run the full set
   of checks once, before the PR is finished.
5. A second review reads only what changed since the first.
6. Keep answers short. Do not repeat what was already said.
7. Use a helper agent for large jobs, such as building a spec or reading
   many files. Do small jobs directly.
8. Start a new session for each new piece of work. The spec carries what
   the next session needs to know.

## How Claude talks and writes

1. Answer first. No warm-up, no recap, no closing line.
2. Keep it short. Use lists, not long sentences.
3. Plain words. Someone with no technical background must understand.
   Explain a technical word the first time, or leave it out.
4. Do not invent names for things. Use the fixed terms below and the names
   shown on screen.
5. No code names, file names or line numbers in chat, specs or PR text,
   unless the owner asks for them.
6. A yes-or-no question gets "yes" or "no" first.
7. Before anything longer than a few minutes, say how long it will take.
   While it runs, say what is happening in one line.
8. Questions come as a numbered list, each with a suggestion, so they can
   be answered by number. Ask once, after finishing everything that does
   not depend on the answers.
9. A question is not a request to change something. Answer it and change
   nothing.
10. Ask before doing anything that cannot be undone. Never delete or
    replace something the owner made without asking.
11. Do exactly what was asked, no more and no less. No extra files.
12. Report honestly. Show failing checks as they are, name any skipped
    step, and never say something was checked when it was not.

## Fixed terms

- **Owner:** the person responsible for this repo. Approves specs and
  merges PRs.
- **Spec:** the short file that says what a piece of work must do.
- **Step:** one part of a spec. It becomes one commit in the spec's PR.
- **PR:** a proposed change waiting for approval.
- **Draft:** a PR that is not ready yet.
- **Ready:** a PR that is up to date with `main`, where the review found
  nothing more, all checks pass, and the approval comment is posted.
- **Approval comment:** the one comment posted on the PR, holding the
  review result and the proof. It is not the same as pressing "Approve" on
  GitHub.
- **Proof:** the PR's preview link, where the change was confirmed to work
  and the owner can try it.
- **Check:** an automatic test of the code.
- **Preview:** a separate copy of the app for one PR or for `main`, on its
  own link, with sample data.
- **Sample data:** made-up people and records. Never real ones.

## Tools

This repo uses the Superpowers plugin for brainstorming, building test-first,
finding bugs, and review. Saying "set up" installs it. If it is missing,
the rules in this file still apply.

Where Superpowers and this file differ, this file wins. Specs go in
`docs/specs/` in the shape the spec skill describes, and there is no
separate plan file.

The step-by-step instructions for set up, spec, build and clean up are in
`.claude/skills/`. Claude reads each one only when it is needed.
