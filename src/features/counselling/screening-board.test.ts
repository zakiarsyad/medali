// Sample NIMs of this file: 9988600100 to 9988600199.
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import type { ScreeningParams } from "./screening-address";
import { readScreeningList, readScreeningNumbers } from "./screening-board";
import { addTestActor, addTestPeople } from "./test-consents";
import { addTestScreening, setTestConsent } from "./test-screenings";

const inTestDatabase = withTestDatabase();

const EVERYONE: ScreeningParams = {
  query: "",
  filter: "all",
  page: 1,
  sharedPage: 1,
};

/**
 * Four students: the first screened Ringan and then Berat, the second
 * SRQ-20 Sedang with consent Menunggu, the third Sangat berat with
 * self-harm, the fourth never screened.
 */
async function addScreened(db: Database) {
  const people = await addTestPeople(db, "Prodi Uji Daftar Asesmen", [
    "9988600101",
    "9988600102",
    "9988600103",
    "9988600104",
  ]);
  const [first = "", second = "", third = ""] = people.studentIds;
  const by = people.counsellor.id;
  await addTestScreening(db, first, by, { screenedOn: "2026-10-01" });
  await addTestScreening(db, first, by, {
    screenedOn: "2026-10-10",
    depression: 11,
    anxiety: 5,
    stress: 10,
    level: "severe",
  });
  await addTestScreening(db, second, by, {
    instrument: "srq20",
    depression: null,
    anxiety: null,
    stress: null,
    srqYes: 7,
    level: "moderate",
  });
  await addTestScreening(db, third, by, {
    selfHarm: true,
    level: "extremely_severe",
  });
  await setTestConsent(db, first, by, "approved");
  await setTestConsent(db, second, by, "waiting");
  return people;
}

describe("the numbers of Konselor", () => {
  it("count the screened students, those of Sedang and above, and those waiting for consent", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor } = await addScreened(db);
      expect(await readScreeningNumbers(db, counsellor)).toEqual({
        screened: 3,
        needCounselling: 3,
        waitingConsent: 1,
      });
    });
  });
});

describe("Daftar mahasiswa of Konselor", () => {
  it("shows each screened student once by the latest screening, the most serious first", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, studentIds } = await addScreened(db);
      const list = await readScreeningList(db, counsellor, EVERYONE);
      expect(list?.matching).toBe(3);
      expect(list?.page).toBe(1);
      expect(list?.rows).toEqual([
        expect.objectContaining({
          studentId: studentIds[2],
          level: "extremely_severe",
          risk: true,
          consent: null,
        }),
        expect.objectContaining({
          studentId: studentIds[0],
          level: "severe",
          screenedOn: "2026-10-10",
          instrument: "dass21",
          risk: false,
          consent: "approved",
          mentorName: null,
          program: "Prodi Uji Daftar Asesmen",
        }),
        expect.objectContaining({
          studentId: studentIds[1],
          level: "moderate",
          instrument: "srq20",
          consent: "waiting",
        }),
      ]);
    });
  });

  it.each([
    ["Perlu konseling", { filter: "counselling" }, [0, 1, 2]],
    ["Menunggu persetujuan", { filter: "waiting" }, [1]],
    ["a search by NIM", { query: "9988600101" }, [0]],
    ["a search by name", { query: "konseling 3" }, [2]],
  ] as const)("narrows to %s", async (_, chosen, places) => {
    await inTestDatabase(async (db) => {
      const { counsellor, studentIds } = await addScreened(db);
      const list = await readScreeningList(db, counsellor, {
        ...EVERYONE,
        ...chosen,
      });
      const shown = list?.rows.map((row) => row.studentId).sort();
      expect(shown).toEqual(places.map((place) => studentIds[place]).sort());
    });
  });

  it("leaves out a Ringan student from Perlu konseling", async () => {
    await inTestDatabase(async (db) => {
      const people = await addTestPeople(db, "Prodi Uji Daftar Ringan", [
        "9988600111",
      ]);
      const [studentId = ""] = people.studentIds;
      await addTestScreening(db, studentId, people.counsellor.id);
      const list = await readScreeningList(db, people.counsellor, {
        ...EVERYONE,
        filter: "counselling",
      });
      expect(list?.matching).toBe(0);
    });
  });

  it.each<RoleId>([
    "head_of_unit",
    "director",
    "head_of_program",
    "mentor",
    "assessor",
    "upk_staff",
    "dorm_manager",
    "bam_health",
    "discipline_officer",
    "student",
  ])("gives %s neither the list nor the numbers", async (role) => {
    await inTestDatabase(async (db) => {
      await addScreened(db);
      const other = await addTestActor(db, "Bukan Konselor", [role]);
      expect(await readScreeningList(db, other, EVERYONE)).toBeNull();
      expect(await readScreeningNumbers(db, other)).toBeNull();
    });
  });
});
