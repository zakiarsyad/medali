---
name: spec
description: Use when the owner says "spec", "new task", "plan", "let's add", "let's start", or describes a feature, change or fix they want. Talks it through with the owner and writes a spec until the owner approves it. Writes no code.
---

# Spec

The goal is one approved spec. No code is written here.

## Steps

1. Tidy first: do steps 1 to 3 of the clean-up skill, quietly.
2. Understand what exists. Look at the names of the specs in `docs/specs/`,
   the open PRs, the lasting facts in `docs/`, and the part of the app
   this touches. Search `docs/PROTOTYPE.html` for the screen in question.
   Search first; read only what is needed. If the work touches personal
   data or what a role may do, read those two parts of
   `docs/BUILDING-RULES.md`.
3. Talk it through with the owner. Ask only what changes the spec, as one
   numbered list, each question with a suggestion.
4. Write the spec and show it in chat.
5. Change it until the owner says OK. Keep every round short: show what
   changed, not the whole spec again.
6. When the owner says OK:
   - make a branch for the first step from the latest `main`, never from
     another branch,
   - save the spec there as `docs/specs/<date>-<number>-<short-name>.md`,
   - commit it as `docs: add spec for <short name>`,
   - push the branch and open a draft PR, so the work is claimed and others
     can see the spec.
7. Tell the owner the spec is saved and that saying "build" starts step 1.

A saved spec is an approved spec. Nothing is saved before the owner's OK.

If Superpowers brainstorming is installed, use it for step 3. The spec still
goes in `docs/specs/` in the shape below, and no plan file is written.

## Scope

- One spec covers one thing. If the request holds several things, split it
  into several specs and suggest an order.
- A spec with more than about five steps is too big. Split it.
- An idea outside the request is not added to the spec. Suggest it as a new
  piece of work, in one line, at the end.

## What a spec contains, in this order

1. **What we want:** 2 to 4 sentences.
2. **Who it is for:** the roles that will use it.
3. **What should happen:** a list of cases, each as "When …, then …".
4. **Not included:** what this work leaves out on purpose.
5. **Open questions:** numbered, each with Claude's suggestion. A spec is
   not approved while a question here is still open.
6. **Steps:** a short numbered list. Each step is one change that can be
   checked on its own, and becomes one PR. The PR that does a step ticks
   it.

## How a spec is written

- One page at most.
- Plain words. Someone who has never seen the code must understand it.
- Use the names people see on screen. No file names or code names.
- Do not guess. If something is unknown, put it under open questions.
