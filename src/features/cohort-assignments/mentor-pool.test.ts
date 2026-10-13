import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { accounts } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestReplacement } from "@/mentoring/test-replacements";
import { readMentorPool } from "./mentor-pool";
import {
  addTestActor,
  addTestLiveGroup,
  addTestMentor,
  addTestMentorOfToday,
  addTestProgram,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const YEAR = 2048;

async function poolNames(db: Database): Promise<string[]> {
  const pool = await readMentorPool(db, YEAR);
  return pool.map((mentor) => mentor.name);
}

/** A mentor who holds today a group of this angkatan. */
async function addHolder(
  db: Database,
  name: string,
  group: { cohortYear: number; number: number; isEnded?: boolean },
): Promise<string> {
  const program = await addTestProgram(db, `UJIPILIH ${name}`);
  const mentorId = await addTestMentor(db, { name });
  const groupId = await addTestLiveGroup(db, program, group);
  await addTestMentorOfToday(db, groupId, mentorId);
  return mentorId;
}

describe("readMentorPool", () => {
  it("gives the mentors without a group, by name, with gelar and unit", async () => {
    await inTestDatabase(async (db) => {
      await addTestMentor(db, {
        name: "Uji Pilih Yuni",
        unit: "Jurusan Pajak",
      });
      await addTestMentor(db, { name: "Uji Pilih Adi", title: "M.Ak." });

      const pool = await readMentorPool(db, YEAR);

      expect(pool).toEqual([
        {
          id: expect.any(String),
          name: "Uji Pilih Adi",
          title: "M.Ak.",
          unit: null,
          hasMentorRole: true,
          leftAsInactive: false,
          isPromised: false,
          heldCohortYears: [],
        },
        expect.objectContaining({
          name: "Uji Pilih Yuni",
          unit: "Jurusan Pajak",
        }),
      ]);
    });
  });

  it("gives a mentor whose groups are all of this angkatan, and not one who holds a group of another", async () => {
    await inTestDatabase(async (db) => {
      await addHolder(db, "Uji Pilih Sama", { cohortYear: YEAR, number: 1 });
      await addHolder(db, "Uji Pilih Lain", {
        cohortYear: YEAR - 1,
        number: 1,
      });

      expect(await poolNames(db)).toEqual(["Uji Pilih Sama"]);
    });
  });

  it("counts a group that was ended as not held", async () => {
    await inTestDatabase(async (db) => {
      await addHolder(db, "Uji Pilih Bekas", {
        cohortYear: YEAR - 1,
        number: 1,
        isEnded: true,
      });

      expect(await poolNames(db)).toEqual(["Uji Pilih Bekas"]);
    });
  });

  it("leaves out a mentor a replacement set Tidak aktif, and one who is kept for a group whose replacement waits", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "UJIPILIH GANTI");
      const first = await addTestLiveGroup(db, program, { cohortYear: YEAR });
      const second = await addTestLiveGroup(db, program, {
        cohortYear: YEAR,
        number: 2,
      });
      const retired = await addTestMentor(db, { name: "Uji Pilih Pensiun" });
      const promised = await addTestMentor(db, {
        name: "Uji Pilih Dijanjikan",
      });
      const holder = await addTestMentor(db, { name: "Uji Pilih Pegang" });
      await addTestMentorOfToday(db, first, holder);
      await addTestMentorOfToday(db, second, holder);
      await addTestReplacement(db, {
        groupId: first,
        oldMentorId: retired,
        newMentorId: holder,
        oldMentorStatus: "inactive",
        carriedOutAt: new Date(),
      });
      await addTestReplacement(db, {
        groupId: second,
        oldMentorId: holder,
        newMentorId: promised,
      });

      expect(await poolNames(db)).toEqual(["Uji Pilih Pegang"]);
    });
  });

  it("leaves out staff without the Pengasuh role and a mentor whose account was removed", async () => {
    await inTestDatabase(async (db) => {
      const remover = await addTestActor(db, ["head_of_unit"], "Uji Pilih UPK");
      const removed = await addTestMentor(db, { name: "Uji Pilih Hapus" });
      await db
        .update(accounts)
        .set({ deletedAt: new Date(), deletedBy: remover.id })
        .where(eq(accounts.id, removed));

      expect(await poolNames(db)).toEqual([]);
    });
  });
});
