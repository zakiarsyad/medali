// Sample NIMs of this file: 9986300600 to 9986300699.
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestProgram,
  addTestRoom,
  addTestStudent,
  placeTestResident,
} from "@/dorms/test-records";
import { STARTING_LIMITS } from "@/health-notes/fitness-ids";
import { addTestNote } from "@/health-notes/test-health";
import { readDormHealthList, readDormHealthNumbers } from "./dorm-health";
import {
  DORM_HEALTH_START,
  type DormHealthParams,
} from "./dorm-health-address";
import {
  readDormHealthSubject,
  searchDormHealthStudents,
} from "./dorm-health-subject";
import {
  addHealthActor,
  addHealthGroup,
  addHealthScores,
  type HealthActor,
} from "./test-health";

const inTestDatabase = withTestDatabase();

const TODAY = "2026-10-16";

/**
 * With no academic period running, only Pembibitan and Internasional
 * students live in the dorm. Five Aktif students and one Non aktif:
 * - Ani, Pembibitan, in Wismantara Putri room 2: a note "Perlu
 *   perhatian" with Asma; in the group of Pengasuh Hana;
 * - Budi, Pembibitan, in Wismantara Putra: tested at 40, no note;
 * - Citra, Pembibitan: tested at 90, a note of advice that follows the
 *   test: not listed;
 * - Fajar, Internasional: a note "Baik";
 * - Dodi, who lives in no dorm: a note "Perlu tindak lanjut medis",
 *   counted nowhere here;
 * - Eka, Pembibitan, Non aktif: counted nowhere.
 */
async function addResidents(db: Database) {
  const programId = await addTestProgram(db, "Prodi Uji Kesehatan Asrama");
  const add = (nim: string, name: string, more = {}) =>
    addTestStudent(db, programId, { nim, name, ...more });
  const seedling = { isSeedling: true };
  const ani = await add("9986300601", "Ani Asrama", seedling);
  const budi = await add("9986300602", "Budi Asrama", {
    ...seedling,
    sex: "male",
  });
  const citra = await add("9986300603", "Citra Asrama", seedling);
  const fajar = await add("9986300604", "Fajar Asrama", {
    isInternational: true,
    sex: "male",
  });
  const dodi = await add("9986300605", "Dodi Luar Asrama");
  const eka = await add("9986300606", "Eka Asrama", {
    ...seedling,
    status: "inactive",
  });
  const room = await addTestRoom(db, {
    number: "SH-601",
    dorm: "wismantara_putri",
    floor: 2,
  });
  await placeTestResident(db, room, ani);
  const kepala = await addHealthActor(db, "Kepala Uji Asrama", [
    "head_of_unit",
  ]);
  const hana = await addHealthActor(db, "Pengasuh Hana Asrama", ["mentor"]);
  await addHealthGroup(db, programId, [ani], hana.id);
  const others = await addHealthGroup(db, programId, [budi, citra, eka]);
  await addHealthScores(db, kepala, others, [
    { studentId: budi, score: 40 },
    { studentId: citra, score: 90 },
  ]);
  const savedAt = new Date("2026-10-12T03:00:00Z");
  await addTestNote(db, kepala, {
    studentId: ani,
    savedAt,
    examiner: "dr. Asrama",
    illnesses: [{ illness: "asthma", note: "sejak SMP" }],
    advice: "Rahasia Ani.",
    category: "attention",
  });
  await addTestNote(db, kepala, {
    studentId: citra,
    savedAt,
    advice: "Rahasia Citra.",
  });
  await addTestNote(db, kepala, {
    studentId: fajar,
    savedAt,
    advice: "Rahasia Fajar.",
    category: "good",
  });
  await addTestNote(db, kepala, {
    studentId: dodi,
    savedAt,
    advice: "Rahasia Dodi.",
    category: "medical",
  });
  await addTestNote(db, kepala, {
    studentId: eka,
    savedAt,
    advice: "Rahasia Eka.",
    category: "medical",
  });
  return { programId, hana, ids: { ani, budi } };
}

async function actorWith(db: Database, roles: RoleId[]): Promise<HealthActor> {
  return addHealthActor(db, `Akun Uji ${roles.join(" ")}`, roles);
}

function read(
  db: Database,
  actor: HealthActor,
  params: Partial<DormHealthParams> = {},
) {
  return readDormHealthList(
    db,
    actor,
    { ...DORM_HEALTH_START, ...params },
    STARTING_LIMITS,
    TODAY,
  );
}

async function namesFor(
  db: Database,
  actor: HealthActor,
  params: Partial<DormHealthParams> = {},
) {
  const found = await read(db, actor, params);
  return found?.list.rows.map((row) => row.name) ?? null;
}

describe("readDormHealthList", () => {
  it.each(["head_of_unit", "bam_health", "dorm_manager", "bam_bphk"] as const)(
    "gives %s the numbers of every Aktif resident and the sick ones, the most serious first",
    async (role) => {
      await inTestDatabase(async (db) => {
        await addResidents(db);

        const found = await read(db, await actorWith(db, [role]));

        expect(found?.list.numbers).toEqual({
          students: 4,
          dorm: 4,
          listed: 3,
          attention: 1,
          medical: 1,
          medicalWithoutNote: 1,
        });
        expect(found?.list.rows.map((row) => row.name)).toEqual([
          "Budi Asrama",
          "Ani Asrama",
          "Fajar Asrama",
        ]);
        expect(found?.reach).toEqual({ kind: "all" });
      });
    },
  );

  it("shows each row's room, Pengasuh, final category and latest note", async () => {
    await inTestDatabase(async (db) => {
      await addResidents(db);

      const found = await read(db, await actorWith(db, ["bam_health"]));
      const ani = found?.list.rows.find((row) => row.name === "Ani Asrama");
      const budi = found?.list.rows.find((row) => row.name === "Budi Asrama");

      expect(ani).toMatchObject({
        dorm: "wismantara_putri",
        room: { dorm: "wismantara_putri", floor: 2, number: "SH-601" },
        mentorName: "Pengasuh Hana Asrama",
        final: { category: "attention", fromNote: true },
        note: {
          examiner: "dr. Asrama",
          illnesses: [{ illness: "asthma", note: "sejak SMP" }],
          advice: "Rahasia Ani.",
        },
      });
      expect(budi).toMatchObject({
        dorm: "wismantara_putra",
        room: null,
        mentorName: null,
        final: { category: "medical", fromNote: false },
        note: null,
      });
    });
  });

  it("follows the search, the dorm, the category and the illness", async () => {
    await inTestDatabase(async (db) => {
      await addResidents(db);
      const bam = await actorWith(db, ["bam_bphk"]);

      expect(await namesFor(db, bam, { query: "fajar" })).toEqual([
        "Fajar Asrama",
      ]);
      expect(await namesFor(db, bam, { query: "9986300601" })).toEqual([
        "Ani Asrama",
      ]);
      expect(await namesFor(db, bam, { dorm: "wismantara_putra" })).toEqual([
        "Budi Asrama",
        "Fajar Asrama",
      ]);
      expect(await namesFor(db, bam, { category: "attention" })).toEqual([
        "Ani Asrama",
      ]);
      expect(await namesFor(db, bam, { illness: "asthma" })).toEqual([
        "Ani Asrama",
      ]);
      const none = await read(db, bam, { dorm: "dana_rakca" });
      expect(none?.list.matching).toBe(0);
      expect(none?.list.rows).toEqual([]);
    });
  });

  it("keeps the numbers to every resident whatever the filters", async () => {
    await inTestDatabase(async (db) => {
      await addResidents(db);

      const found = await read(db, await actorWith(db, ["dorm_manager"]), {
        illness: "asthma",
      });

      expect(found?.list.numbers.listed).toBe(3);
      expect(found?.list.matching).toBe(1);
    });
  });

  it("shows the last page when the address asks for one beyond it", async () => {
    await inTestDatabase(async (db) => {
      await addResidents(db);

      const found = await read(db, await actorWith(db, ["head_of_unit"]), {
        page: 9,
      });

      expect(found?.list.page).toBe(1);
      expect(found?.list.rows).toHaveLength(3);
    });
  });

  it.each([
    "director",
    "head_of_program",
    "student",
    "bam_compliance",
    "counsellor",
    "assessor",
    "upk_staff",
    "discipline_officer",
  ] as const)(
    "reads nothing for %s, who may not read the list",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { programId } = await addResidents(db);

        const actor = await addHealthActor(
          db,
          "Akun Uji Tolak",
          [role],
          programId,
        );

        expect(await read(db, actor)).toBeNull();
      });
    },
  );
});

describe("the list for Pengasuh", () => {
  it("holds only their own mentees who live in the dorm, in the numbers too", async () => {
    await inTestDatabase(async (db) => {
      const { hana } = await addResidents(db);

      const found = await read(db, hana);

      expect(found?.list.numbers.students).toBe(1);
      expect(found?.list.rows.map((row) => row.name)).toEqual(["Ani Asrama"]);
      expect(found?.reach).toMatchObject({ menteesOf: [hana.id] });
    });
  });

  it("finds nobody when they search for a resident who is not their mentee", async () => {
    await inTestDatabase(async (db) => {
      const { hana } = await addResidents(db);

      const found = await read(db, hana, { query: "Budi" });

      expect(found?.list.matching).toBe(0);
      expect(found?.list.rows).toEqual([]);
    });
  });

  it("keeps Pengasuh who is also Ketua Program Studi to their own mentees", async () => {
    await inTestDatabase(async (db) => {
      const { programId } = await addResidents(db);
      const both = await addHealthActor(
        db,
        "Pengasuh Kaprodi Uji",
        ["mentor", "head_of_program"],
        programId,
      );

      const found = await read(db, both);

      expect(found?.list.numbers.students).toBe(0);
      expect(found?.list.rows).toEqual([]);
    });
  });

  it("gives Pengasuh no resident to pick and no notes to open", async () => {
    await inTestDatabase(async (db) => {
      const { hana, ids } = await addResidents(db);

      expect(await searchDormHealthStudents(db, hana, "Ani", TODAY)).toEqual(
        [],
      );
      expect(
        await readDormHealthSubject(db, hana, ids.ani, STARTING_LIMITS, TODAY),
      ).toBeNull();
    });
  });
});

/** Three more Pembibitan residents, Gita of another program, all well. */
async function addMoreResidents(db: Database, programId: number) {
  const otherProgram = await addTestProgram(db, "Prodi Uji Asrama Lain");
  await addTestStudent(db, programId, {
    nim: "9986300611",
    name: "Hani Asrama",
    isSeedling: true,
  });
  await addTestStudent(db, programId, {
    nim: "9986300612",
    name: "Indra Asrama",
    isSeedling: true,
    sex: "male",
  });
  await addTestStudent(db, otherProgram, {
    nim: "9986300613",
    name: "Gita Asrama",
    isSeedling: true,
  });
}

function count(db: Database, actor: HealthActor) {
  return readDormHealthNumbers(db, actor, STARTING_LIMITS, TODAY);
}

describe("readDormHealthNumbers", () => {
  it("gives Direktur no number below 5 residents in reach", async () => {
    await inTestDatabase(async (db) => {
      await addResidents(db);

      const found = await count(db, await actorWith(db, ["director"]));

      expect(found?.counts).toEqual({ kind: "too_few" });
    });
  });

  it("gives Direktur the numbers from 5 residents, each of 1 to 4 as <5, and never a name, illness or note", async () => {
    await inTestDatabase(async (db) => {
      const { programId } = await addResidents(db);
      await addMoreResidents(db, programId);

      const found = await count(db, await actorWith(db, ["director"]));

      expect(found).toEqual({
        counts: {
          kind: "shown",
          residents: 7,
          listed: "<5",
          attention: "<5",
          medical: "<5",
          medicalWithoutNote: "<5",
          listedShare: null,
        },
        reach: { kind: "all" },
      });
      const sent = JSON.stringify(found);
      for (const secret of ["Asrama", "Rahasia", "asthma", "99863006"]) {
        expect(sent).not.toContain(secret);
      }
    });
  });

  it("counts for Ketua Program Studi only the residents of their own program", async () => {
    await inTestDatabase(async (db) => {
      const { programId } = await addResidents(db);
      await addMoreResidents(db, programId);
      const kaprodi = await addHealthActor(
        db,
        "Kaprodi Uji Asrama",
        ["head_of_program"],
        programId,
      );

      const found = await count(db, kaprodi);

      expect(found?.counts).toMatchObject({ kind: "shown", residents: 6 });
      expect(found?.reach).toMatchObject({ studyProgramIds: [programId] });
    });
  });

  it("gives Direktur and Ketua Program Studi nothing of the list, nor a resident to pick or open", async () => {
    await inTestDatabase(async (db) => {
      const { programId, ids } = await addResidents(db);

      for (const role of ["director", "head_of_program"] as const) {
        const actor = await addHealthActor(
          db,
          "Pimpinan Uji Asrama",
          [role],
          programId,
        );
        expect(await read(db, actor, { query: "Ani" })).toBeNull();
        expect(await searchDormHealthStudents(db, actor, "Ani", TODAY)).toEqual(
          [],
        );
        expect(
          await readDormHealthSubject(
            db,
            actor,
            ids.ani,
            STARTING_LIMITS,
            TODAY,
          ),
        ).toBeNull();
      }
    });
  });

  it.each([
    "head_of_unit",
    "bam_health",
    "mentor",
    "student",
    "counsellor",
  ] as const)(
    "reads nothing for %s, who has no numbers-only right",
    async (role) => {
      await inTestDatabase(async (db) => {
        await addResidents(db);

        expect(await count(db, await actorWith(db, [role]))).toBeNull();
      });
    },
  );
});
