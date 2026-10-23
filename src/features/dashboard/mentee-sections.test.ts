// Sample Tahun akademik of this file: 5210 to 5210.
// Sample NIMs of this file: 9989660000 to 9989660099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import {
  counsellingSharingReads,
  counsellingSharings,
  mentorGroupMembers,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestPenaltyOf,
  TEST_DESCRIPTION,
} from "@/discipline-penalties/test-penalties";
import { addTestScreening } from "@/features/counselling/test-screenings";
import {
  addTestAccount,
  addTestGroup,
  addTestProgram,
  addTestStudent,
} from "@/features/mentoring/test-records";
import type { MenteeDashboard } from "./mentee-recap";
import { menteeScopeOf } from "./mentee-scope";
import { loadMenteeDashboard } from "./mentee-view";
import { addTestPublishedLevel } from "./test-records";

const inTestDatabase = withTestDatabase();

const TODAY = "5210-10-31";

/**
 * Four anak asuh of `mentor`: 01 and 02 published to Pengasuh, 03
 * published to Kepala Unit only, 04 with nothing. 05 is the student of
 * another Pengasuh, published to Pengasuh.
 */
async function addRecords(db: Database) {
  const programId = await addTestProgram(db, "Prodi Uji Bagian Anak Asuh");
  const mentor = await addTestAccount(db, "Pengasuh Uji Bagian", ["mentor"]);
  const other = await addTestAccount(db, "Pengasuh Uji Bagian Lain", [
    "mentor",
  ]);
  const add = (nim: string) =>
    addTestStudent(db, programId, {
      nim: `99896600${nim}`,
      name: `Mahasiswa Uji Bagian ${nim}`,
    });
  const ids = {
    s01: await add("01"),
    s02: await add("02"),
    s03: await add("03"),
    s04: await add("04"),
    s05: await add("05"),
  };
  const { s05, ...own } = ids;
  await addTestGroup(db, programId, {
    number: 1,
    memberIds: Object.values(own),
    mentorId: mentor.id,
  });
  await addTestGroup(db, programId, {
    number: 2,
    memberIds: [s05],
    mentorId: other.id,
  });
  for (const studentId of [ids.s01, ids.s02, ids.s03, s05]) {
    await addTestScreening(db, studentId, mentor.id, { level: "moderate" });
  }
  const sharings = {
    s01: await addTestPublishedLevel(db, ids.s01, mentor.id, ["mentor"]),
    s02: await addTestPublishedLevel(db, ids.s02, mentor.id, ["mentor"]),
  };
  await addTestPublishedLevel(db, ids.s03, mentor.id, ["head_of_unit"]);
  await addTestPublishedLevel(db, s05, mentor.id, ["mentor"]);
  return { mentor, ids, sharings };
}

async function load(db: Database, account: AccountForAccess) {
  const scope = menteeScopeOf(account);
  if (scope === null) throw new Error("No scope.");
  const view: MenteeDashboard = await loadMenteeDashboard(
    db,
    scope,
    null,
    TODAY,
  );
  if (view.kind !== "shown") throw new Error("No group.");
  return view;
}

describe("section 4 of Dashboard anak asuh", () => {
  it("lists only the anak asuh whose data is published to Pengasuh", async () => {
    await inTestDatabase(async (db) => {
      const { mentor, ids } = await addRecords(db);

      const { published } = (await load(db, mentor)).cards;

      expect(published.rows.map((row) => row.studentId).sort()).toEqual(
        [ids.s01, ids.s02].sort(),
      );
      expect(published.matching).toBe(2);
      expect(published.needCounselling).toBe(2);
    });
  });

  it("logs the reading of each record it shows, and of no other", async () => {
    await inTestDatabase(async (db) => {
      const { mentor, ids } = await addRecords(db);

      await load(db, mentor);
      const readings = await db
        .select({ studentId: counsellingSharingReads.studentId })
        .from(counsellingSharingReads)
        .where(eq(counsellingSharingReads.readBy, mentor.id));

      expect(new Set(readings.map((row) => row.studentId))).toEqual(
        new Set([ids.s01, ids.s02]),
      );
    });
  });

  it("leaves out on the next load a student who withdrew consent or left the group", async () => {
    await inTestDatabase(async (db) => {
      const { mentor, ids, sharings } = await addRecords(db);
      await db
        .update(counsellingSharings)
        .set({ status: "withdrawn" })
        .where(eq(counsellingSharings.id, sharings.s01));
      await db
        .delete(mentorGroupMembers)
        .where(eq(mentorGroupMembers.studentId, ids.s02));

      const { published } = (await load(db, mentor)).cards;

      expect(published.rows).toEqual([]);
      expect(published.matching).toBe(0);
    });
  });
});

describe("Pelanggaran disiplin of Dashboard anak asuh", () => {
  it("gives the 5 latest penalties of the anak asuh, newest first, and none of another Pengasuh's student", async () => {
    await inTestDatabase(async (db) => {
      const { mentor, ids } = await addRecords(db);
      const light = { category: "light", level: 1 } as const;
      const days = ["01", "02", "03", "04", "05"];
      for (const day of days) {
        await addTestPenaltyOf(db, ids.s01, mentor.id, light, `5210-10-${day}`);
      }
      await addTestPenaltyOf(
        db,
        ids.s02,
        mentor.id,
        { category: "medium", level: 2 },
        "5210-10-06",
      );
      await addTestPenaltyOf(db, ids.s05, mentor.id, light, "5210-10-30");

      const { penalties } = await load(db, mentor);

      expect(penalties.map((row) => row.day)).toEqual([
        "5210-10-06",
        "5210-10-05",
        "5210-10-04",
        "5210-10-03",
        "5210-10-02",
      ]);
      expect(penalties[0]).toMatchObject({
        studentId: ids.s02,
        name: "Mahasiswa Uji Bagian 02",
        category: "medium",
        level: 2,
        description: TEST_DESCRIPTION,
        opensDetail: true,
      });
      expect(penalties.some((row) => row.studentId === ids.s05)).toBe(false);
    });
  });

  it("gives none while no anak asuh has a penalty", async () => {
    await inTestDatabase(async (db) => {
      const { mentor, ids } = await addRecords(db);
      await addTestPenaltyOf(db, ids.s05, mentor.id, {
        category: "light",
        level: 1,
      });

      expect((await load(db, mentor)).penalties).toEqual([]);
    });
  });
});
