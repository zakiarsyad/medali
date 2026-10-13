// Sample NIMs of this file: 9961000500 to 9961000599.
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { mentoringNotes } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { countRecentNotes, RECENT_NOTE_DAYS } from "./recent-notes";
import {
  addTestGroup,
  addTestMembers,
  addTestMentor,
  addTestMentorLine,
  addTestProgram,
  addTestStudent,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const TODAY = "2026-10-13";
/** The first day of the last 90 days, and the day before it. */
const FIRST_DAY = "2026-07-16";
const DAY_BEFORE = "2026-07-15";

interface Records {
  programId: number;
  groupId: string;
  mentorId: string;
  /** Two Aktif members of the group. */
  first: string;
  second: string;
}

async function addRecords(db: Database): Promise<Records> {
  const programId = await addTestProgram(db, "UJICATATAN90");
  const groupId = await addTestGroup(db, programId);
  const mentorId = await addTestMentor(db, { name: "Pengasuh Uji 90 Hari" });
  await addTestMentorLine(db, groupId, mentorId);
  const first = await addTestStudent(db, programId, {
    nim: "9961000501",
    name: "Anggota Uji Catatan Satu",
  });
  const second = await addTestStudent(db, programId, {
    nim: "9961000502",
    name: "Anggota Uji Catatan Dua",
  });
  await addTestMembers(db, groupId, [first, second]);
  return { programId, groupId, mentorId, first, second };
}

async function addNote(
  db: Database,
  studentId: string,
  writtenBy: string,
  happenedOn: string,
): Promise<void> {
  await db.insert(mentoringNotes).values({
    id: randomUUID(),
    studentId,
    writtenBy,
    kind: "appreciation",
    happenedOn,
    valueKeys: ["E"],
    note: "Catatan uji.",
    followUp: "none",
  });
}

describe("countRecentNotes", () => {
  it("counts the notes of the last 90 days about the members of the group", async () => {
    await inTestDatabase(async (db) => {
      const { groupId, mentorId, first, second } = await addRecords(db);
      await addNote(db, first, mentorId, TODAY);
      await addNote(db, first, mentorId, "2026-09-01");
      await addNote(db, second, mentorId, FIRST_DAY);

      expect(await countRecentNotes(db, groupId, TODAY)).toBe(3);
      expect(RECENT_NOTE_DAYS).toBe(90);
    });
  });

  it("leaves out a note older than 90 days", async () => {
    await inTestDatabase(async (db) => {
      const { groupId, mentorId, first } = await addRecords(db);
      await addNote(db, first, mentorId, FIRST_DAY);
      await addNote(db, first, mentorId, DAY_BEFORE);
      await addNote(db, first, mentorId, "2025-05-20");

      expect(await countRecentNotes(db, groupId, TODAY)).toBe(1);
    });
  });

  it("counts a note an earlier mentor of the group wrote", async () => {
    await inTestDatabase(async (db) => {
      const { groupId, first } = await addRecords(db);
      const earlier = await addTestMentor(db, { name: "Pengasuh Uji 90 Lama" });
      await addNote(db, first, earlier, "2026-09-15");

      expect(await countRecentNotes(db, groupId, TODAY)).toBe(1);
    });
  });

  it("leaves out the notes about students of another group", async () => {
    await inTestDatabase(async (db) => {
      const { programId, groupId, mentorId, first } = await addRecords(db);
      const otherGroup = await addTestGroup(db, programId, { number: 2 });
      const outsider = await addTestStudent(db, programId, {
        nim: "9961000503",
        name: "Anggota Uji Kelompok Lain",
      });
      await addTestMembers(db, otherGroup, [outsider]);
      await addNote(db, first, mentorId, TODAY);
      await addNote(db, outsider, mentorId, TODAY);

      expect(await countRecentNotes(db, groupId, TODAY)).toBe(1);
      expect(await countRecentNotes(db, otherGroup, TODAY)).toBe(1);
    });
  });

  it("counts the notes about a member on Cuti, and none about a Non aktif or removed one", async () => {
    await inTestDatabase(async (db) => {
      const { programId, groupId, mentorId } = await addRecords(db);
      const onLeave = await addTestStudent(db, programId, {
        nim: "9961000504",
        name: "Anggota Uji Catatan Cuti",
        status: "on_leave",
      });
      const inactive = await addTestStudent(db, programId, {
        nim: "9961000505",
        name: "Anggota Uji Catatan Nonaktif",
        status: "inactive",
      });
      const removed = await addTestStudent(db, programId, {
        nim: "9961000506",
        name: "Anggota Uji Catatan Dihapus",
        deletedAt: new Date(),
      });
      await addTestMembers(db, groupId, [onLeave, inactive, removed]);
      for (const studentId of [onLeave, inactive, removed]) {
        await addNote(db, studentId, mentorId, TODAY);
      }

      expect(await countRecentNotes(db, groupId, TODAY)).toBe(1);
    });
  });

  it("is 0 for a group without notes", async () => {
    await inTestDatabase(async (db) => {
      const { groupId } = await addRecords(db);

      expect(await countRecentNotes(db, groupId, TODAY)).toBe(0);
    });
  });
});
