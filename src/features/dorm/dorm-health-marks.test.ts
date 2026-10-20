// Sample NIMs of this file: 9986400300 to 9986400399.
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { mentalHealthMarkChanges, mentalHealthMarks } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import { STARTING_LIMITS } from "@/health-notes/fitness-ids";
import { addTestNote } from "@/health-notes/test-health";
import { readDormHealthList, readDormHealthNumbers } from "./dorm-health";
import {
  DORM_HEALTH_START,
  type DormHealthParams,
} from "./dorm-health-address";
import type { MarkCategory } from "./mental-health-mark-ids";
import { readMarkLog, readMarkOf } from "./mental-health-marks";
import {
  addHealthActor,
  addHealthGroup,
  type HealthActor,
} from "./test-health";

const inTestDatabase = withTestDatabase();

const TODAY = "2026-10-16";

/**
 * With no academic period running, only Pembibitan students live in the
 * dorm. Six Aktif residents and one student who lives in no dorm:
 * - Ani: a note "Perlu perhatian" with Asma; in the group of Pengasuh
 *   Hana;
 * - Citra: a note "Baik";
 * - Budi, Eka, Fani and Gani: well, no note;
 * - Dodi, who lives in no dorm.
 */
async function addResidents(db: Database) {
  const programId = await addTestProgram(db, "Prodi Uji Penanda Daftar");
  const add = (nim: string, name: string, more = {}) =>
    addTestStudent(db, programId, { nim, name, isSeedling: true, ...more });
  const ani = await add("9986400301", "Ani Daftar");
  const budi = await add("9986400302", "Budi Daftar", { sex: "male" });
  const citra = await add("9986400303", "Citra Daftar");
  await add("9986400304", "Eka Daftar");
  await add("9986400305", "Fani Daftar");
  await add("9986400306", "Gani Daftar", { sex: "male" });
  const dodi = await add("9986400307", "Dodi Luar", { isSeedling: false });
  const kepala = await addHealthActor(db, "Kepala Uji Daftar", [
    "head_of_unit",
  ]);
  const hana = await addHealthActor(db, "Pengasuh Hana Daftar", ["mentor"]);
  await addHealthGroup(db, programId, [ani], hana.id);
  const savedAt = new Date("2026-10-12T03:00:00Z");
  await addTestNote(db, kepala, {
    studentId: ani,
    savedAt,
    illnesses: [{ illness: "asthma", note: "" }],
    advice: "Rahasia Ani.",
    category: "attention",
  });
  await addTestNote(db, kepala, {
    studentId: citra,
    savedAt,
    advice: "Rahasia Citra.",
    category: "good",
  });
  return { programId, kepala, hana, ids: { ani, budi, citra, dodi } };
}

async function addMark(
  db: Database,
  by: { id: string },
  studentId: string,
  category: MarkCategory,
  observation: string,
) {
  await db.insert(mentalHealthMarks).values({
    studentId,
    category,
    observation,
    changedBy: by.id,
    changedAt: new Date("2026-10-13T03:00:00Z"),
  });
}

/**
 * Ani marked "perlu pemantauan", Budi, who has nothing else, "perlu
 * dirujuk ke konselor", and Dodi, outside the dorm, too.
 */
async function addMarks(
  db: Database,
  by: { id: string },
  ids: { ani: string; budi: string; dodi: string },
) {
  await addMark(db, by, ids.ani, "monitor", "Sulit tidur.");
  await addMark(db, by, ids.budi, "refer", "Menarik diri.");
  await addMark(db, by, ids.dodi, "refer", "Rahasia Dodi.");
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

function names(found: Awaited<ReturnType<typeof read>>) {
  return found?.list.rows.map((row) => row.name) ?? null;
}

const SECRETS = ["Sulit tidur", "Menarik diri", "monitor", "refer"];

describe("the marks in the list for the roles that read them", () => {
  it.each<RoleId>(["head_of_unit", "bam_health", "dorm_manager"])(
    "give %s the number, the badge and the observation, and list a resident with only a mark",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { kepala, ids } = await addResidents(db);
        await addMarks(db, kepala, ids);

        const found = await read(db, await addHealthActor(db, "Uji", [role]));

        expect(found?.list.numbers).toMatchObject({ students: 6, listed: 3 });
        expect(names(found)).toEqual([
          "Ani Daftar",
          "Citra Daftar",
          "Budi Daftar",
        ]);
        expect(found?.marks).toEqual({
          counts: { marked: 2, referred: 1 },
          byStudent: {
            [ids.ani]: { category: "monitor", observation: "Sulit tidur." },
            [ids.budi]: { category: "refer", observation: "Menarik diri." },
          },
        });
      });
    },
  );

  it("filter by Potensi kesehatan mental to the marked residents, keeping the numbers", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, ids } = await addResidents(db);
      await addMarks(db, kepala, ids);

      const found = await read(db, kepala, { markOnly: true });

      expect(names(found)).toEqual(["Ani Daftar", "Budi Daftar"]);
      expect(found?.list.matching).toBe(2);
      expect(found?.list.numbers.listed).toBe(3);
    });
  });

  it("show no mark once it is set back to Tidak ada indikasi", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, ids } = await addResidents(db);
      await db.insert(mentalHealthMarks).values({
        studentId: ids.budi,
        category: null,
        observation: "",
        changedBy: kepala.id,
        changedAt: new Date(),
      });

      const found = await read(db, kepala);

      expect(names(found)).toEqual(["Ani Daftar", "Citra Daftar"]);
      expect(found?.marks).toEqual({
        counts: { marked: 0, referred: 0 },
        byStudent: {},
      });
    });
  });
});

describe("the marks for the roles that may not read them", () => {
  it("give BAM - BPHK nothing: no number, no mark, no resident who has only a mark, and a filter by mark changes nothing", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, ids } = await addResidents(db);
      const bphk = await addHealthActor(db, "BPHK Uji Daftar", ["bam_bphk"]);
      const before = await read(db, bphk);
      await addMarks(db, kepala, ids);

      const after = await read(db, bphk);
      const filtered = await read(db, bphk, { markOnly: true });

      expect(after).toEqual(before);
      expect(filtered).toEqual(before);
      expect(after?.marks).toBeNull();
      expect(names(after)).toEqual(["Ani Daftar", "Citra Daftar"]);
      const sent = JSON.stringify([after, filtered]);
      for (const secret of SECRETS) expect(sent).not.toContain(secret);
    });
  });

  it.each<RoleId>(["director", "head_of_program"])(
    "give %s numbers that a mark does not change",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { programId, kepala, ids } = await addResidents(db);
        const actor = await addHealthActor(
          db,
          "Pimpinan Uji",
          [role],
          programId,
        );
        const count = () =>
          readDormHealthNumbers(db, actor, STARTING_LIMITS, TODAY);
        const before = await count();
        await addMarks(db, kepala, ids);

        const after = await count();

        expect(after).toEqual(before);
        expect(after?.counts).toMatchObject({ kind: "shown", residents: 6 });
        const sent = JSON.stringify(after);
        for (const secret of SECRETS) expect(sent).not.toContain(secret);
      });
    },
  );
});

describe("the marks for Pengasuh", () => {
  it("are those of their own mentees only, in the number too", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, hana, ids } = await addResidents(db);
      await addMarks(db, kepala, ids);

      const found = await read(db, hana);
      const filtered = await read(db, hana, { markOnly: true });

      expect(names(found)).toEqual(["Ani Daftar"]);
      expect(found?.marks).toEqual({
        counts: { marked: 1, referred: 0 },
        byStudent: {
          [ids.ani]: { category: "monitor", observation: "Sulit tidur." },
        },
      });
      expect(names(filtered)).toEqual(["Ani Daftar"]);
      expect(JSON.stringify(found)).not.toContain("Menarik diri");
    });
  });

  it("cannot be asked by hand for a resident who is not their mentee", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, hana, ids } = await addResidents(db);
      await addMarks(db, kepala, ids);

      expect(await readMarkOf(db, hana, ids.ani)).toEqual({
        category: "monitor",
        observation: "Sulit tidur.",
      });
      expect(await readMarkOf(db, hana, ids.budi)).toBeNull();
    });
  });

  it("stay their own mentees' for Pengasuh who is also BAM - BPHK, who sees every resident's list", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, hana, ids } = await addResidents(db);
      await addMarks(db, kepala, ids);
      const both: HealthActor = { ...hana, roles: ["mentor", "bam_bphk"] };

      const found = await read(db, both);

      expect(found?.list.numbers).toMatchObject({ students: 6, listed: 2 });
      expect(names(found)).toEqual(["Ani Daftar", "Citra Daftar"]);
      expect(found?.marks).toEqual({
        counts: { marked: 1, referred: 0 },
        byStudent: {
          [ids.ani]: { category: "monitor", observation: "Sulit tidur." },
        },
      });
      expect(await readMarkOf(db, both, ids.budi)).toBeNull();
    });
  });

  it.each<RoleId>([
    "student",
    "bam_bphk",
    "director",
    "head_of_program",
    "counsellor",
  ])("give %s no mark asked by hand", async (role) => {
    await inTestDatabase(async (db) => {
      const { kepala, ids } = await addResidents(db);
      await addMarks(db, kepala, ids);
      const actor = await addHealthActor(db, "Uji Tanpa Penanda", [role]);

      expect(
        await readMarkOf(db, { ...actor, studentId: ids.ani }, ids.ani),
      ).toBeNull();
    });
  });
});

describe("the marks for a reader who is a resident", () => {
  it("leave out their own mark: no badge, number, filter or mark asked by hand", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, ids } = await addResidents(db);
      await addMarks(db, kepala, ids);
      const bam = await addHealthActor(db, "BAM Ani Daftar", ["bam_health"]);
      const own: HealthActor = { ...bam, studentId: ids.ani };

      const found = await read(db, own);
      const filtered = await read(db, own, { markOnly: true });

      expect(names(found)).toEqual([
        "Ani Daftar",
        "Citra Daftar",
        "Budi Daftar",
      ]);
      expect(found?.marks).toEqual({
        counts: { marked: 1, referred: 1 },
        byStudent: {
          [ids.budi]: { category: "refer", observation: "Menarik diri." },
        },
      });
      expect(names(filtered)).toEqual(["Budi Daftar"]);
      expect(await readMarkOf(db, own, ids.ani)).toBeNull();
      expect(JSON.stringify([found, filtered])).not.toContain("Sulit tidur");
    });
  });

  it("do not list them by their own mark alone", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, ids } = await addResidents(db);
      await addMarks(db, kepala, ids);
      const bam = await addHealthActor(db, "BAM Budi Daftar", ["bam_health"]);

      const found = await read(db, { ...bam, studentId: ids.budi });

      expect(names(found)).toEqual(["Ani Daftar", "Citra Daftar"]);
      expect(found?.marks?.counts).toEqual({ marked: 1, referred: 0 });
    });
  });

  it("give no log of their own mark", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, ids } = await addResidents(db);
      await db.insert(mentalHealthMarkChanges).values({
        studentId: ids.ani,
        categoryBefore: null,
        observationBefore: "",
        categoryAfter: "monitor",
        observationAfter: "Sulit tidur.",
        changedBy: kepala.id,
        changedAt: new Date(),
      });

      expect(await readMarkLog(db, kepala, ids.ani)).toHaveLength(1);
      expect(
        await readMarkLog(db, { ...kepala, studentId: ids.ani }, ids.ani),
      ).toEqual([]);
    });
  });
});
