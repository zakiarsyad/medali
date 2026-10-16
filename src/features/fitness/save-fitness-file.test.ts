// Sample NIMs of this file: 9986200700 to 9986200799.
import { createHash } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { fitnessScores, fitnessTests, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { DAY_IN_FUTURE, NO_TEST_DAY } from "./fitness-input";
import { latestFitnessScores } from "./latest-fitness-scores";
import {
  FILE_ALREADY_SENT,
  NOTHING_TO_SAVE,
  savedFileMessage,
  saveFitnessFile,
} from "./save-fitness-file";
import { NOT_ALLOWED_TO_ENTER } from "./save-fitness-scores";
import {
  addTestActor,
  addTestGroup,
  addTestScores,
  addTestStudents,
} from "./test-fitness";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 16 October 2026.
const MOMENT = new Date("2026-10-16T03:00:00Z");

const ROWS = [
  "nim,skor",
  "9986200701,60",
  "9986200702,88",
  "9986200701,72",
  "9986200799,80",
  "9986200703,79.5",
];

function csv(lines: string[], name = "kebugaran-oktober.csv") {
  return { name, bytes: new TextEncoder().encode(lines.join("\n")) };
}

async function addRecords(db: Database) {
  const { programId, studentIds } = await addTestStudents(
    db,
    "Prodi Uji Simpan Berkas Jasmani",
    ["9986200701", "9986200702", "9986200703"],
  );
  const [ani = "", budi = "", citra = ""] = studentIds;
  const penilai = await addTestActor(db, "Penilai Uji Berkas Jasmani", [
    "assessor",
  ]);
  return { programId, ani, budi, citra, penilai };
}

function testOf(db: Database, id: string) {
  return db.select().from(fitnessTests).where(eq(fitnessTests.id, id));
}

function scoresOf(db: Database, studentIds: string[]) {
  return db
    .select()
    .from(fitnessScores)
    .where(inArray(fitnessScores.studentId, studentIds));
}

async function latestOf(db: Database, studentId: string) {
  const latest = latestFitnessScores(db);
  const [found] = await db
    .select({ score: latest.score, testedOn: latest.testedOn })
    .from(latest)
    .where(eq(latest.studentId, studentId));
  return found;
}

describe("saveFitnessFile", () => {
  it("keeps every ready row with the chosen Tanggal tes, each its own line in the log, tied to one save that keeps the file's name", async () => {
    await inTestDatabase(async (db) => {
      const { ani, budi, citra, penilai } = await addRecords(db);
      const id = crypto.randomUUID();
      const file = csv(ROWS);

      const saved = await saveFitnessFile(
        db,
        penilai,
        id,
        "2026-10-14",
        file,
        MOMENT,
      );

      expect(saved).toEqual({ ok: true, value: 2 });
      expect(await testOf(db, id)).toEqual([
        {
          id,
          groupId: null,
          fileName: "kebugaran-oktober.csv",
          fingerprint: createHash("sha256").update(file.bytes).digest("hex"),
          testedOn: "2026-10-14",
          enteredBy: penilai.id,
          enteredAt: expect.any(Date),
        },
      ]);
      const kept = await scoresOf(db, [ani, budi, citra]);
      expect(
        kept.map((row) => [row.testId, row.studentId, row.score]).sort(),
      ).toEqual(
        [
          [id, ani, 72],
          [id, budi, 88],
        ].sort(),
      );
    });
  });

  it("makes each row the student's latest test, over a score saved before by the group form", async () => {
    await inTestDatabase(async (db) => {
      const { programId, ani, penilai } = await addRecords(db);
      const groupId = await addTestGroup(db, programId, [ani]);
      await addTestScores(db, penilai, {
        groupId,
        testedOn: "2026-10-15",
        enteredAt: new Date("2026-10-15T03:00:00Z"),
        scores: [{ studentId: ani, score: 40 }],
      });

      await saveFitnessFile(
        db,
        penilai,
        crypto.randomUUID(),
        "2026-10-14",
        csv(ROWS),
        MOMENT,
      );

      expect(await latestOf(db, ani)).toEqual({
        score: 72,
        testedOn: "2026-10-14",
      });
      expect(await scoresOf(db, [ani])).toHaveLength(2);
    });
  });

  it("says how many rows were saved", () => {
    expect(savedFileMessage(1234)).toBe("1.234 baris tersimpan.");
  });

  it("lets Kepala Unit save a file too", async () => {
    await inTestDatabase(async (db) => {
      await addRecords(db);
      const kepala = await addTestActor(db, "Kepala Uji Berkas Jasmani", [
        "head_of_unit",
      ]);

      expect(
        await saveFitnessFile(
          db,
          kepala,
          crypto.randomUUID(),
          "2026-10-16",
          csv(ROWS),
          MOMENT,
        ),
      ).toEqual({ ok: true, value: 2 });
    });
  });

  it.each<[string, RoleId]>([
    ["Pengasuh", "mentor"],
    ["Direktur", "director"],
    ["a student", "student"],
  ])(
    "refuses %s sending a file by hand, and keeps nothing",
    async (_, role) => {
      await inTestDatabase(async (db) => {
        const { ani, budi } = await addRecords(db);
        const actor = await addTestActor(db, "Tanpa Hak Berkas Jasmani", [
          role,
        ]);
        const id = crypto.randomUUID();

        const saved = await saveFitnessFile(
          db,
          { ...actor, studentId: role === "student" ? ani : null },
          id,
          "2026-10-16",
          csv(ROWS),
          MOMENT,
        );

        expect(saved).toEqual(NOT_ALLOWED_TO_ENTER);
        expect(await scoresOf(db, [ani, budi])).toEqual([]);
        expect(await testOf(db, id)).toEqual([]);
      });
    },
  );

  it("saves a file pressed twice once, and answers the second press as the first", async () => {
    await inTestDatabase(async (db) => {
      const { ani, budi, penilai } = await addRecords(db);
      const id = crypto.randomUUID();
      const save = () =>
        saveFitnessFile(db, penilai, id, "2026-10-16", csv(ROWS), MOMENT);

      const first = await save();
      const second = await save();

      expect(second).toEqual(first);
      expect(await scoresOf(db, [ani, budi])).toHaveLength(2);
    });
  });

  it("refuses the key of a saved file for another file, another Tanggal tes, another account or a group form", async () => {
    await inTestDatabase(async (db) => {
      const { programId, ani, budi, citra, penilai } = await addRecords(db);
      const kepala = await addTestActor(db, "Kepala Uji Kunci Jasmani", [
        "head_of_unit",
      ]);
      const id = crypto.randomUUID();
      await saveFitnessFile(db, penilai, id, "2026-10-16", csv(ROWS), MOMENT);
      const changed = csv([...ROWS, "9986200703,80"]);

      for (const [actor, testedOn, file] of [
        [penilai, "2026-10-16", changed],
        [penilai, "2026-10-15", csv(ROWS)],
        [kepala, "2026-10-16", csv(ROWS)],
      ] as const) {
        expect(
          await saveFitnessFile(db, actor, id, testedOn, file, MOMENT),
        ).toEqual(FILE_ALREADY_SENT);
      }
      const groupId = await addTestGroup(db, programId, [citra]);
      const formKey = await addTestScores(db, penilai, {
        groupId,
        testedOn: "2026-10-16",
        enteredAt: new Date(),
        scores: [{ studentId: citra, score: 80 }],
      });
      expect(
        await saveFitnessFile(
          db,
          penilai,
          formKey,
          "2026-10-16",
          csv(ROWS),
          MOMENT,
        ),
      ).toEqual(FILE_ALREADY_SENT);
      expect(await scoresOf(db, [ani, budi])).toHaveLength(2);
    });
  });

  it("saves nothing of the file when one part of the save fails", async () => {
    await inTestDatabase(async (db) => {
      const { ani, budi, penilai } = await addRecords(db);
      await db.execute(sql`
        create trigger fitness_file_test_fails before insert on fitness_scores
        for each row execute function refuse_fitness_edit()`);
      const id = crypto.randomUUID();

      await expect(
        saveFitnessFile(db, penilai, id, "2026-10-16", csv(ROWS), MOMENT),
      ).rejects.toThrow();

      expect(await scoresOf(db, [ani, budi])).toEqual([]);
      expect(await testOf(db, id)).toEqual([]);
    });
  });

  it("reads the file again at the save: a student no longer Aktif is skipped then", async () => {
    await inTestDatabase(async (db) => {
      const { ani, budi, penilai } = await addRecords(db);
      await db
        .update(students)
        .set({ status: "on_leave" })
        .where(eq(students.id, budi));

      const saved = await saveFitnessFile(
        db,
        penilai,
        crypto.randomUUID(),
        "2026-10-16",
        csv(ROWS),
        MOMENT,
      );

      expect(saved).toEqual({ ok: true, value: 1 });
      expect(await scoresOf(db, [budi])).toEqual([]);
      expect(await scoresOf(db, [ani])).toHaveLength(1);
    });
  });

  it.each([
    [
      "a Tanggal tes after today",
      "2026-10-17",
      csv(ROWS),
      { ok: false, error: DAY_IN_FUTURE },
    ],
    ["no Tanggal tes", "", csv(ROWS), { ok: false, error: NO_TEST_DAY }],
    [
      "a file with no row to save",
      "2026-10-16",
      csv(["nim,skor", "9986200799,80"]),
      NOTHING_TO_SAVE,
    ],
    [
      "a file that is not CSV",
      "2026-10-16",
      { name: "kebugaran.xlsx", bytes: new Uint8Array([80, 75, 3, 4]) },
      {
        ok: false,
        error:
          "Berkas harus berformat CSV. Simpan berkas sebagai CSV sesuai templat, lalu unggah lagi.",
      },
    ],
  ])("refuses %s, and keeps nothing", async (_, testedOn, file, refusal) => {
    await inTestDatabase(async (db) => {
      const { ani, budi, penilai } = await addRecords(db);
      const id = crypto.randomUUID();

      const saved = await saveFitnessFile(
        db,
        penilai,
        id,
        testedOn,
        file,
        MOMENT,
      );

      expect(saved).toEqual(refusal);
      expect(await scoresOf(db, [ani, budi])).toEqual([]);
      expect(await testOf(db, id)).toEqual([]);
    });
  });

  it("refuses a key that is not one", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);

      expect(
        await saveFitnessFile(
          db,
          penilai,
          "bukan-kunci",
          "2026-10-16",
          csv(ROWS),
          MOMENT,
        ),
      ).toEqual(FILE_ALREADY_SENT);
    });
  });
});
