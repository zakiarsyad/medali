// Sample NIMs of this file: 9989760000 to 9989760099.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { readOwnNotes } from "./own-notes";
import { saveNote } from "./save-note";
import {
  addTestAccount,
  addTestGroup,
  addTestNote,
  addTestProgram,
  addTestStudent,
  testNoteInput,
  testNotesOf,
} from "./test-records";

const inTestDatabase = withTestDatabase();

function studentAccount(
  studentId: string,
  roles: RoleId[] = ["student"],
): AccountForAccess {
  return { id: crypto.randomUUID(), roles, studyProgramId: null, studentId };
}

/** Ani with two notes by her pengasuh, Budi with one. */
async function setting(db: Database) {
  const programId = await addTestProgram(db, "UJICATATANSENDIRI");
  const ani = await addTestStudent(db, programId, {
    nim: "9989760001",
    name: "Ani Uji Catatan Sendiri",
  });
  const budi = await addTestStudent(db, programId, {
    nim: "9989760002",
    name: "Budi Uji Catatan Sendiri",
  });
  const mentor = await addTestAccount(db, "Pengasuh Uji Catatan Sendiri", [
    "mentor",
  ]);
  await addTestGroup(db, programId, {
    number: 1,
    memberIds: [ani, budi],
    mentorId: mentor.id,
  });
  const older = await addTestNote(db, ani, mentor.id, {
    writtenAt: new Date("2026-10-01T03:00:00Z"),
  });
  const newer = await addTestNote(db, ani, mentor.id, {
    writtenAt: new Date("2026-10-11T03:00:00Z"),
    followUp: "watch_two_weeks",
  });
  await addTestNote(db, budi, mentor.id);
  return { ani, budi, mentor, older, newer };
}

describe("readOwnNotes", () => {
  it("gives a student every note about them, the newest first, never who wrote it", async () => {
    await inTestDatabase(async (db) => {
      const { ani, older, newer } = await setting(db);

      const own = await readOwnNotes(db, studentAccount(ani));

      expect(own?.map((note) => note.id)).toEqual([newer, older]);
      expect(Object.keys(own?.[0] ?? {}).sort()).toEqual([
        "followUp",
        "happenedOn",
        "id",
        "kind",
        "note",
        "valueKeys",
      ]);
      expect(own?.[0]?.followUp).toBe("watch_two_weeks");
    });
  });

  it("only ever gives a student their own, whichever other role they hold", async () => {
    await inTestDatabase(async (db) => {
      const { budi } = await setting(db);
      const both = studentAccount(budi, ["student", "head_of_unit"]);

      expect(await readOwnNotes(db, both)).toHaveLength(1);
    });
  });

  it("gives nothing to an account without the right", async () => {
    await inTestDatabase(async (db) => {
      const { ani, mentor } = await setting(db);

      expect(await readOwnNotes(db, { ...mentor, studentId: ani })).toBeNull();
    });
  });

  it("shows a note the pengasuh writes the next time the page is opened", async () => {
    await inTestDatabase(async (db) => {
      const { budi, mentor } = await setting(db);

      const saved = await saveNote(db, mentor, testNoteInput(budi));

      expect(saved.ok).toBe(true);
      expect(await readOwnNotes(db, studentAccount(budi))).toHaveLength(2);
    });
  });

  it("refuses a note a student writes about themselves by a hand-made request", async () => {
    await inTestDatabase(async (db) => {
      const { budi } = await setting(db);

      const saved = await saveNote(
        db,
        studentAccount(budi),
        testNoteInput(budi),
      );

      expect(saved.ok).toBe(false);
      expect(await testNotesOf(db, budi)).toHaveLength(1);
    });
  });
});

describe("Catatan pengasuhan on Profil saya", () => {
  const PAGE = readFileSync("src/app/(app)/saya/page.tsx", "utf8");

  it("stands last, after Pembinaan, Kesehatan jasmani and Kesehatan mental, for the student of the account", () => {
    const order = [
      "<OwnScoreHistoryPanel ",
      "<OwnCoachingPanel account={account} />",
      "<OwnFitnessPanel account={account} />",
      "<OwnMentalPanel account={account} />",
      "<OwnNotesPanel account={account} />",
    ].map((panel) => PAGE.indexOf(panel));

    const notes = PAGE.indexOf("<OwnNotesPanel account={account} />");

    expect(order).not.toContain(-1);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(PAGE.indexOf("<Own", notes + 1)).toBe(-1);
  });
});
