import type { CountMarks } from "./count-ids";

/*
 * Read by the screen parts in the browser, so nothing here may take from
 * the database code.
 */

/**
 * The participants who are absent or have a note, as a log line keeps
 * them: every other one was Hadir without a note.
 */
export function loggedMarks(marks: CountMarks): CountMarks {
  const logged: CountMarks = {};
  for (const [id, mark] of Object.entries(marks)) {
    if (mark.isAbsent || mark.note !== "") logged[id] = mark;
  }
  return logged;
}
