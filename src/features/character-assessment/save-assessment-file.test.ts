// Sample Tahun akademik of this file: 3265 to 3265.
// Sample NIMs of this file: 9986160000 to 9986160099.
import { createHash } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import {
  characterAssessments,
  characterAssessmentUploads,
  students,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestPenaltyOf,
  addTestRecorder,
} from "@/discipline-penalties/test-penalties";
import { SCORE_ABOVE_LIMIT } from "./assessment-file";
import { previewAssessmentFile } from "./assessment-file-check";
import { readAssessmentHistory } from "./assessment-history";
import {
  FILE_ALREADY_SENT,
  NO_PERIOD,
  NOT_ALLOWED_TO_ASSESS,
  NOTHING_TO_SAVE,
  UNKNOWN_SOURCE,
} from "./assessment-messages";
import { readLatestOf } from "./latest-assessments";
import { saveAssessmentFile, savedFileMessage } from "./save-assessment-file";
import {
  addTestActor,
  addTestAssessment,
  addTestPeriod,
  addTestStudents,
} from "./test-assessments";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 12 October 3265.
const MOMENT = new Date("3265-10-12T03:00:00Z");
// The day before the period starts.
const BEFORE_PERIOD = new Date("3265-07-31T03:00:00Z");

const TITLES = "nim,mandiri,empati,disiplin,adaptif,loyal,integritas";
const ROWS = [
  TITLES,
  "9986160001,70,70,70,70,70,70",
  "9986160002,90,88,92,86,90,94",
  "9986160001,80,78,84,72,82,86.4",
  "9986160099,80,78,84,72,82,86",
];

function csv(lines: string[], name = "asesmen-oktober.csv") {
  return { name, bytes: new TextEncoder().encode(lines.join("\n")) };
}

async function addRecords(db: Database) {
  const periodId = await addTestPeriod(db, 3265);
  const { programId, studentIds } = await addTestStudents(
    db,
    "Prodi Uji Simpan Berkas Asesmen",
    3265,
    ["9986160001", "9986160002", "9986160003"],
  );
  const [ani, budi, citra] = studentIds;
  if (!ani || !budi || !citra) throw new Error("Students missing.");
  const penilai = await addTestActor(db, "Penilai Uji Berkas", ["assessor"]);
  return { periodId, programId, ani, budi, citra, penilai };
}

function rowsOf(db: Database, uploadId: string) {
  return db
    .select()
    .from(characterAssessments)
    .where(eq(characterAssessments.uploadId, uploadId));
}

function uploadOf(db: Database, id: string) {
  return db
    .select()
    .from(characterAssessmentUploads)
    .where(eq(characterAssessmentUploads.id, id));
}

function keptOf(db: Database, studentIds: string[]) {
  return db
    .select()
    .from(characterAssessments)
    .where(inArray(characterAssessments.studentId, studentIds));
}

describe("saveAssessmentFile", () => {
  it("keeps every ready row as the student's newest assessment, with its own line in the log, tied to the upload with the file name", async () => {
    await inTestDatabase(async (db) => {
      const { periodId, ani, budi, penilai } = await addRecords(db);
      const id = crypto.randomUUID();
      const file = csv(ROWS);

      const saved = await saveAssessmentFile(
        db,
        penilai,
        id,
        "medali_instrument",
        file,
        MOMENT,
      );

      expect(saved).toEqual({ ok: true, value: { saved: 2 } });
      expect(await uploadOf(db, id)).toEqual([
        {
          id,
          fileName: "asesmen-oktober.csv",
          fingerprint: createHash("sha256").update(file.bytes).digest("hex"),
          enteredBy: penilai.id,
          enteredAt: MOMENT,
        },
      ]);
      const rows = await rowsOf(db, id);
      expect(
        rows.map((row) => [row.studentId, row.scoreM, row.scoreI]).sort(),
      ).toEqual(
        [
          [ani, 80, 86],
          [budi, 90, 94],
        ].sort(),
      );
      for (const row of rows) {
        expect(row).toMatchObject({
          source: "medali_instrument",
          note: "",
          periodId,
          enteredBy: penilai.id,
          enteredAt: MOMENT,
          uploadId: id,
        });
      }
    });
  });

  it("makes each row the student's latest, shown with the file name beside the source in the list and the history", async () => {
    await inTestDatabase(async (db) => {
      const { periodId, ani, penilai } = await addRecords(db);
      await addTestAssessment(db, penilai, {
        studentId: ani,
        periodId,
        enteredAt: new Date("3265-10-01T03:00:00Z"),
      });

      await saveAssessmentFile(
        db,
        penilai,
        crypto.randomUUID(),
        "medali_instrument",
        csv(ROWS),
        MOMENT,
      );

      const latest = (await readLatestOf(db, [ani])).get(ani);
      expect(latest).toMatchObject({
        source: "medali_instrument",
        fileName: "asesmen-oktober.csv",
        scores: { M: 80, E: 78, D: 84, A: 72, L: 82, I: 86 },
      });
      const history = await readAssessmentHistory(
        db,
        visibleTo({ kind: "all" }),
        ani,
        true,
      );
      expect(history?.entries.map((entry) => entry.fileName)).toEqual([
        "asesmen-oktober.csv",
        null,
      ]);
    });
  });

  it("says how many rows were saved", () => {
    expect(savedFileMessage({ saved: 1234 })).toBe("1.234 baris tersimpan.");
  });

  it("lets Kepala Unit save a file too", async () => {
    await inTestDatabase(async (db) => {
      await addRecords(db);
      const kepala = await addTestActor(db, "Kepala Uji Berkas", [
        "head_of_unit",
      ]);

      const saved = await saveAssessmentFile(
        db,
        kepala,
        crypto.randomUUID(),
        "mentor_observation",
        csv(ROWS),
        MOMENT,
      );

      expect(saved).toEqual({ ok: true, value: { saved: 2 } });
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
        const actor = await addTestActor(db, "Tanpa Hak Berkas", [role]);
        const id = crypto.randomUUID();

        const saved = await saveAssessmentFile(
          db,
          { ...actor, studentId: role === "student" ? ani : null },
          id,
          "mentor_observation",
          csv(ROWS),
          MOMENT,
        );

        expect(saved).toEqual(NOT_ALLOWED_TO_ASSESS);
        expect(await keptOf(db, [ani, budi])).toEqual([]);
        expect(await uploadOf(db, id)).toEqual([]);
      });
    },
  );

  it("saves a file pressed twice once, and answers the second press as the first", async () => {
    await inTestDatabase(async (db) => {
      const { ani, budi, penilai } = await addRecords(db);
      const id = crypto.randomUUID();
      const save = () =>
        saveAssessmentFile(
          db,
          penilai,
          id,
          "mentor_observation",
          csv(ROWS),
          MOMENT,
        );

      const first = await save();
      const second = await save();

      expect(second).toEqual(first);
      expect(await keptOf(db, [ani, budi])).toHaveLength(2);
    });
  });

  it("refuses the key of a saved upload for another file, another source or another account", async () => {
    await inTestDatabase(async (db) => {
      const { ani, budi, penilai } = await addRecords(db);
      const kepala = await addTestActor(db, "Kepala Uji Kunci", [
        "head_of_unit",
      ]);
      const id = crypto.randomUUID();
      await saveAssessmentFile(
        db,
        penilai,
        id,
        "mentor_observation",
        csv(ROWS),
        MOMENT,
      );
      const changed = csv([...ROWS, "9986160003,80,80,80,80,80,80"]);

      for (const [actor, source, file] of [
        [penilai, "mentor_observation", changed],
        [penilai, "self_assessment", csv(ROWS)],
        [kepala, "mentor_observation", csv(ROWS)],
      ] as const) {
        expect(
          await saveAssessmentFile(db, actor, id, source, file, MOMENT),
        ).toEqual(FILE_ALREADY_SENT);
      }
      expect(await keptOf(db, [ani, budi])).toHaveLength(2);
    });
  });

  it("saves nothing of the file when one part of the save fails", async () => {
    await inTestDatabase(async (db) => {
      const { ani, budi, penilai } = await addRecords(db);
      await db.execute(sql`
        create trigger assessment_file_test_fails before insert on character_assessments
        for each row execute function refuse_character_assessment_edit()`);
      const id = crypto.randomUUID();

      await expect(
        saveAssessmentFile(
          db,
          penilai,
          id,
          "mentor_observation",
          csv(ROWS),
          MOMENT,
        ),
      ).rejects.toThrow();

      expect(await keptOf(db, [ani, budi])).toEqual([]);
      expect(await uploadOf(db, id)).toEqual([]);
    });
  });

  it("reads the file again at the save: a student no longer Aktif is skipped then", async () => {
    await inTestDatabase(async (db) => {
      const { ani, budi, penilai } = await addRecords(db);
      await db
        .update(students)
        .set({ status: "on_leave" })
        .where(eq(students.id, budi));

      const saved = await saveAssessmentFile(
        db,
        penilai,
        crypto.randomUUID(),
        "mentor_observation",
        csv(ROWS),
        MOMENT,
      );

      expect(saved).toEqual({ ok: true, value: { saved: 1 } });
      expect(await keptOf(db, [budi])).toEqual([]);
      expect(await keptOf(db, [ani])).toHaveLength(1);
    });
  });

  it("skips a row with a score above 70 for a student under a Ringan or Sedang penalty, in the preview and at the save", async () => {
    await inTestDatabase(async (db) => {
      const { ani, budi, penilai } = await addRecords(db);
      const recorder = await addTestRecorder(db);
      await addTestPenaltyOf(db, budi, recorder, {
        category: "light",
        level: 1,
      });
      await addTestPenaltyOf(db, ani, recorder, {
        category: "heavy",
        level: 1,
      });

      const preview = await previewAssessmentFile(db, penilai, csv(ROWS));
      const saved = await saveAssessmentFile(
        db,
        penilai,
        crypto.randomUUID(),
        "mentor_observation",
        csv(ROWS),
        MOMENT,
      );

      expect(preview.ok && preview.value.firstSkipped).toContainEqual({
        row: 3,
        nim: "9986160002",
        reason: SCORE_ABOVE_LIMIT,
      });
      expect(saved).toEqual({ ok: true, value: { saved: 1 } });
      expect(await keptOf(db, [budi])).toEqual([]);
      expect(await keptOf(db, [ani])).toHaveLength(1);
    });
  });

  it.each([
    [
      "a file with no row to save",
      "mentor_observation",
      csv([TITLES, "9986160099,80,78,84,72,82,86"]),
      NOTHING_TO_SAVE,
    ],
    ["a source that is not on the list", "rumor", csv(ROWS), UNKNOWN_SOURCE],
    [
      "a file that is not CSV",
      "mentor_observation",
      { name: "asesmen.xlsx", bytes: new Uint8Array([80, 75, 3, 4]) },
      {
        ok: false,
        error:
          "Berkas harus berformat CSV. Simpan berkas sebagai CSV sesuai templat, lalu unggah lagi.",
      },
    ],
  ])("refuses %s, and keeps nothing", async (_, source, file, refusal) => {
    await inTestDatabase(async (db) => {
      const { ani, budi, penilai } = await addRecords(db);
      const id = crypto.randomUUID();

      const saved = await saveAssessmentFile(
        db,
        penilai,
        id,
        source,
        file,
        MOMENT,
      );

      expect(saved).toEqual(refusal);
      expect(await keptOf(db, [ani, budi])).toEqual([]);
      expect(await uploadOf(db, id)).toEqual([]);
    });
  });

  it("refuses while no academic period runs, and a key that is not one", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);

      expect(
        await saveAssessmentFile(
          db,
          penilai,
          crypto.randomUUID(),
          "mentor_observation",
          csv(ROWS),
          BEFORE_PERIOD,
        ),
      ).toEqual(NO_PERIOD);
      expect(
        await saveAssessmentFile(
          db,
          penilai,
          "bukan-kunci",
          "mentor_observation",
          csv(ROWS),
          MOMENT,
        ),
      ).toEqual(FILE_ALREADY_SENT);
    });
  });
});
