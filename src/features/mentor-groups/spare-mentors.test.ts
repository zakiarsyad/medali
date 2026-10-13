import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { addTestReplacement } from "@/mentoring/test-replacements";
import { findSpareMentor, listSpareMentors } from "./spare-mentors";
import {
  addTestEndedGroup,
  addTestGroup,
  addTestMentor,
  addTestMentorLine,
  addTestMentorRole,
  addTestProgram,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const PROGRAM = "UJICADANGAN";
const CARRIED_OUT = new Date("2026-10-01T03:00:00Z");

/** An account with the Pengasuh role and no group. */
async function addSpare(db: Database, name: string): Promise<string> {
  const id = await addTestMentor(db, { name, unit: "Unit Uji Cadangan" });
  await addTestMentorRole(db, id);
  return id;
}

/** Whether each of these accounts is offered as a spare mentor. */
async function offered(db: Database, ids: string[]): Promise<boolean[]> {
  const spares = await listSpareMentors(db);
  return ids.map((id) => spares.some((spare) => spare.id === id));
}

describe("listSpareMentors", () => {
  it("gives a mentor with the role and no group, by name, without the NIP", async () => {
    await inTestDatabase(async (db) => {
      const later = await addSpare(db, "Uji Cadangan Zaki");
      const sooner = await addSpare(db, "Uji Cadangan Ayu");

      const spares = await listSpareMentors(db);
      const own = spares.filter((spare) => [later, sooner].includes(spare.id));

      expect(own).toEqual([
        {
          id: sooner,
          name: "Uji Cadangan Ayu",
          title: null,
          unit: "Unit Uji Cadangan",
        },
        {
          id: later,
          name: "Uji Cadangan Zaki",
          title: null,
          unit: "Unit Uji Cadangan",
        },
      ]);
    });
  });

  it("leaves out one who holds a group, one without the role, and takes one whose only group is ended", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, PROGRAM);
      const holder = await addSpare(db, "Uji Cadangan Pegang");
      await addTestMentorLine(db, await addTestGroup(db, program), holder);
      const noRole = await addTestMentor(db, { name: "Uji Cadangan Tanpa" });
      const freed = await addSpare(db, "Uji Cadangan Bebas");
      const ended = await addTestEndedGroup(db, program, { number: 2 });
      await addTestMentorLine(db, ended, freed);

      expect(await offered(db, [holder, noRole, freed])).toEqual([
        false,
        false,
        true,
      ]);
    });
  });

  it("leaves out one a replacement set Tidak aktif, and takes one it set Cadangan", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, PROGRAM);
      const groupId = await addTestGroup(db, program);
      const otherGroupId = await addTestGroup(db, program, { number: 2 });
      const retired = await addSpare(db, "Uji Cadangan Pensiun");
      const stayed = await addSpare(db, "Uji Cadangan Tetap");
      const newMentorId = await addSpare(db, "Uji Cadangan Baru");
      const otherNewId = await addSpare(db, "Uji Cadangan Baru Dua");
      await addTestReplacement(db, {
        groupId,
        oldMentorId: retired,
        newMentorId,
        reason: "retirement",
        oldMentorStatus: "inactive",
        carriedOutAt: CARRIED_OUT,
      });
      await addTestReplacement(db, {
        groupId: otherGroupId,
        oldMentorId: stayed,
        newMentorId: otherNewId,
        carriedOutAt: CARRIED_OUT,
      });

      expect(await offered(db, [retired, stayed])).toEqual([false, true]);
    });
  });

  it("goes by the replacement with the latest start date", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, PROGRAM);
      const groupId = await addTestGroup(db, program);
      const otherGroupId = await addTestGroup(db, program, { number: 2 });
      const mentorId = await addSpare(db, "Uji Cadangan Dua Kali");
      const newMentorId = await addSpare(db, "Uji Cadangan Baru");
      await addTestReplacement(db, {
        groupId,
        oldMentorId: mentorId,
        newMentorId,
        startsOn: "2026-03-01",
        oldMentorStatus: "inactive",
        carriedOutAt: new Date("2026-03-01T03:00:00Z"),
      });
      await addTestReplacement(db, {
        groupId: otherGroupId,
        oldMentorId: mentorId,
        newMentorId,
        startsOn: "2026-09-01",
        oldMentorStatus: "reserve",
        carriedOutAt: new Date("2026-09-01T03:00:00Z"),
      });

      expect(await offered(db, [mentorId])).toEqual([true]);
    });
  });

  it("leaves out one who is kept for a group whose replacement waits, until that one is cancelled", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, PROGRAM);
      const groupId = await addTestGroup(db, program);
      const otherGroupId = await addTestGroup(db, program, { number: 2 });
      const oldMentorId = await addSpare(db, "Uji Cadangan Lama");
      const promised = await addSpare(db, "Uji Cadangan Dijanjikan");
      const released = await addSpare(db, "Uji Cadangan Dilepas");
      await addTestReplacement(db, {
        groupId,
        oldMentorId,
        newMentorId: promised,
      });
      await addTestReplacement(db, {
        groupId: otherGroupId,
        oldMentorId,
        newMentorId: released,
        cancelledBy: oldMentorId,
        cancelledAt: new Date(),
      });

      expect(await offered(db, [promised, released])).toEqual([false, true]);
    });
  });
});

describe("findSpareMentor", () => {
  it("finds a spare mentor, and none for one who holds a group", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, PROGRAM);
      const spare = await addSpare(db, "Uji Cadangan Cari");
      const holder = await addSpare(db, "Uji Cadangan Pegang");
      await addTestMentorLine(db, await addTestGroup(db, program), holder);

      expect(await findSpareMentor(db, spare)).toMatchObject({
        id: spare,
        name: "Uji Cadangan Cari",
      });
      expect(await findSpareMentor(db, holder)).toBeNull();
    });
  });
});
