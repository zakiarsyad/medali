// Sample NIMs of this file: 9961000400 to 9961000499.
import { describe, expect, it } from "vitest";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { saveNote } from "./save-note";
import {
  addTestAccount,
  addTestGroup,
  addTestProgram,
  addTestStudent,
  testNoteInput,
  testNotesOf,
} from "./test-records";

/*
 * Two presses at the same moment need two connections that both see the
 * saved note, so this check has a database of its own, dropped at the end.
 */
const own = withOwnTestDatabase("catatan");

describe("Simpan catatan pressed twice at the same moment", () => {
  it("saves one note: the second press waits for the first, then finds its note saved", async () => {
    const programId = await addTestProgram(own.db, "UJICATATANDUAKALI");
    const mentor = await addTestAccount(own.db, "Pengasuh Dua Kali", [
      "mentor",
    ]);
    const menteeId = await addTestStudent(own.db, programId, {
      nim: "9961000401",
      name: "Anak Asuh Dua Kali",
    });
    await addTestGroup(own.db, programId, {
      number: 1,
      memberIds: [menteeId],
      mentorId: mentor.id,
    });
    const input = testNoteInput(menteeId);

    const both = await own.atOnce(
      (db) => saveNote(db, mentor, input),
      (db) => saveNote(db, mentor, input),
    );

    const saved = { ok: true, value: { studentName: "Anak Asuh Dua Kali" } };
    expect(both.sooner).toEqual(saved);
    expect(both.later).toEqual(saved);
    expect(await testNotesOf(own.db, menteeId)).toHaveLength(1);
  });
});
