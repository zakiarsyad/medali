// Sample NIMs of this file: 9986300400 to 9986300499.
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { healthRecapReadings } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestProgram,
  addTestRoom,
  addTestStudent,
  placeTestResident,
} from "@/dorms/test-records";
import { STARTING_LIMITS } from "@/health-notes/fitness-ids";
import { addTestNote } from "@/health-notes/test-health";
import { readHealthRecap } from "./health-recap";
import { RECAP_START, type RecapParams } from "./recap-address";
import {
  addTestActor,
  addTestGroup,
  addTestScores,
  type TestActor,
} from "./test-fitness";

const inTestDatabase = withTestDatabase();

const TODAY = "2026-10-16";

/**
 * Six Aktif students and one Non aktif:
 * - Ani (88) with a note "Perlu perhatian" and Asma: listed, from the note;
 * - Budi (40), no note: listed, Perlu tindak lanjut medis without a note;
 * - Citra (90) with a note of advice only that follows the test: not listed;
 * - Dodi, not tested, with a note "Baik" and no illness: listed;
 * - Eka (50), a Pembibitan student in Wismantara Putri, room 2: listed;
 * - Fajar (75) with "Riwayat lain" only: listed;
 * - Gita (30), Non aktif: counted nowhere.
 * Ani is in the group of Pengasuh Hana.
 */
async function addRecap(db: Database) {
  const programId = await addTestProgram(db, "Prodi Uji Rekap Kesehatan");
  const add = (nim: string, name: string, more = {}) =>
    addTestStudent(db, programId, { nim, name, ...more });
  const ani = await add("9986300401", "Ani Rekap");
  const budi = await add("9986300402", "Budi Rekap");
  const citra = await add("9986300403", "Citra Rekap");
  const dodi = await add("9986300404", "Dodi Rekap");
  const eka = await add("9986300405", "Eka Rekap", { isSeedling: true });
  const fajar = await add("9986300406", "Fajar Rekap");
  const gita = await add("9986300407", "Gita Rekap", { status: "inactive" });
  const room = await addTestRoom(db, {
    number: "RK-401",
    dorm: "wismantara_putri",
    floor: 2,
  });
  await placeTestResident(db, room, eka);
  const kepala = await addTestActor(db, "Kepala Uji Rekap", ["head_of_unit"]);
  const hana = await addTestActor(db, "Pengasuh Hana", ["mentor"]);
  const groupId = await addTestGroup(db, programId, [ani], {
    mentorId: hana.id,
  });
  const otherGroup = await addTestGroup(
    db,
    programId,
    [budi, citra, eka, fajar, gita],
    { number: 2 },
  );
  await addTestScores(db, kepala, {
    groupId,
    testedOn: "2026-10-01",
    enteredAt: new Date("2026-10-01T03:00:00Z"),
    scores: [{ studentId: ani, score: 88 }],
  });
  await addTestScores(db, kepala, {
    groupId: otherGroup,
    testedOn: "2026-10-01",
    enteredAt: new Date("2026-10-01T03:00:00Z"),
    scores: [
      { studentId: budi, score: 40 },
      { studentId: citra, score: 90 },
      { studentId: eka, score: 50 },
      { studentId: fajar, score: 75 },
      { studentId: gita, score: 30 },
    ],
  });
  const savedAt = new Date("2026-10-12T03:00:00Z");
  await addTestNote(db, kepala, {
    studentId: ani,
    savedAt,
    examinedOn: "2026-10-12",
    examiner: "dr. Rekap",
    illnesses: [{ illness: "asthma", note: "sejak SMP" }],
    advice: "Rahasia Ani.",
    category: "attention",
  });
  await addTestNote(db, kepala, {
    studentId: citra,
    savedAt,
    advice: "Rahasia Citra.",
    category: null,
  });
  await addTestNote(db, kepala, {
    studentId: dodi,
    savedAt,
    advice: "Rahasia Dodi.",
    category: "good",
  });
  await addTestNote(db, kepala, {
    studentId: fajar,
    savedAt,
    otherHistory: "Sinusitis",
    advice: "",
    category: null,
  });
  return { kepala, programId, ids: { ani, budi, citra, dodi, eka, fajar } };
}

type Student = keyof Awaited<ReturnType<typeof addRecap>>["ids"];

function read(
  db: Database,
  actor: TestActor,
  params: Partial<RecapParams> = {},
) {
  return readHealthRecap(
    db,
    actor,
    { ...RECAP_START, ...params },
    STARTING_LIMITS,
    TODAY,
  );
}

describe("readHealthRecap", () => {
  it("gives Kepala Unit the four numbers of the Aktif students", async () => {
    await inTestDatabase(async (db) => {
      const { kepala } = await addRecap(db);

      const recap = await read(db, kepala);

      expect(recap?.numbers).toEqual({
        students: 6,
        dorm: 1,
        listed: 5,
        attention: 1,
        medical: 2,
        medicalWithoutNote: 2,
      });
    });
  });

  it("lists the ill, the most serious first, then by name, with room, Pengasuh, note and who and when", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, ids } = await addRecap(db);

      const recap = await read(db, kepala);

      expect(recap?.rows.map((row) => row.id)).toEqual([
        ids.budi,
        ids.eka,
        ids.ani,
        ids.dodi,
        ids.fajar,
      ]);
      expect(recap?.matching).toBe(5);
      const [budi, eka, ani] = recap?.rows ?? [];
      expect(budi).toMatchObject({
        room: null,
        mentorName: null,
        final: { category: "medical", fromNote: false },
        note: null,
      });
      expect(eka?.room).toEqual({
        dorm: "wismantara_putri",
        floor: 2,
        number: "RK-401",
      });
      expect(ani).toMatchObject({
        name: "Ani Rekap",
        mentorName: "Pengasuh Hana",
        final: { category: "attention", fromNote: true },
        note: {
          examinedOn: "2026-10-12",
          examiner: "dr. Rekap",
          savedBy: "Kepala Uji Rekap",
          illnesses: [{ illness: "asthma", note: "sejak SMP" }],
          advice: "Rahasia Ani.",
        },
      });
    });
  });

  it.each<[string, Partial<RecapParams>, Student[]]>([
    ["Asrama", { residence: "dorm" }, ["eka"]],
    ["Non asrama", { residence: "non_dorm" }, ["budi", "ani", "dodi", "fajar"]],
    ["Perlu perhatian", { category: "attention" }, ["ani"]],
    ["Baik", { category: "good" }, ["dodi", "fajar"]],
    ["Asma", { illness: "asthma" }, ["ani"]],
    ["a NIM", { query: "9986300404" }, ["dodi"]],
  ])("narrows to %s", async (_, params, expected) => {
    await inTestDatabase(async (db) => {
      const { kepala, ids } = await addRecap(db);

      const recap = await read(db, kepala, params);

      expect(recap?.rows.map((row) => row.id)).toEqual(
        expected.map((name) => ids[name]),
      );
    });
  });

  it("shows 25 students a page", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, programId } = await addRecap(db);
      const studentIds: string[] = [];
      for (let place = 10; place < 31; place += 1) {
        studentIds.push(
          await addTestStudent(db, programId, {
            nim: `99863004${place}`,
            name: `Rekap Tambahan ${place}`,
          }),
        );
      }
      const groupId = await addTestGroup(db, programId, studentIds, {
        number: 3,
      });
      await addTestScores(db, kepala, {
        groupId,
        testedOn: "2026-10-01",
        enteredAt: new Date("2026-10-01T03:00:00Z"),
        scores: studentIds.map((studentId) => ({ studentId, score: 20 })),
      });

      const first = await read(db, kepala);
      const second = await read(db, kepala, { page: 2 });

      expect(first?.matching).toBe(26);
      expect(first?.rows).toHaveLength(25);
      expect(second?.rows).toHaveLength(1);
      expect(second?.page).toBe(2);
    });
  });

  it("logs each reading with who, when and the filters, never the searched text", async () => {
    await inTestDatabase(async (db) => {
      const { kepala } = await addRecap(db);

      await read(db, kepala, { query: "Ani Rekap", illness: "asthma" });

      const readings = await db.select().from(healthRecapReadings);
      expect(readings).toEqual([
        expect.objectContaining({
          readBy: kepala.id,
          filters: {
            searched: true,
            residence: "all",
            category: "all",
            illness: "asthma",
            page: 1,
          },
        }),
      ]);
      expect(JSON.stringify(readings)).not.toContain("Ani");
    });
  });

  it.each<RoleId>([
    "director",
    "head_of_program",
    "mentor",
    "assessor",
    "counsellor",
    "bam_health",
    "bam_bphk",
    "dorm_manager",
    "student",
  ])("refuses %s, sending no note and logging nothing", async (role) => {
    await inTestDatabase(async (db) => {
      const { programId } = await addRecap(db);
      const actor = await addTestActor(db, "Bukan Kepala Uji Rekap", [role], {
        studyProgramId: programId,
      });

      expect(await read(db, actor)).toBeNull();
      expect(await db.select().from(healthRecapReadings)).toEqual([]);
    });
  });
});
