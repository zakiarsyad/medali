// Sample NIMs of this file: 9986300200 to 9986300299.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { healthNoteIllnesses, healthNotes, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestStudent } from "@/dorms/test-records";
import { STARTING_LIMITS } from "@/health-notes/fitness-ids";
import {
  NO_NOTE,
  NOTE_DAY_IN_FUTURE,
  type SentNote,
} from "@/health-notes/health-input";
import { NOTE_ALREADY_SENT } from "@/health-notes/save-note";
import {
  mayWriteNotes,
  readHealthSubject,
  searchHealthStudents,
} from "./health-subject";
import {
  NOT_ALLOWED_TO_WRITE,
  NOT_WRITABLE,
  saveHealthNote,
} from "./save-health-note";
import {
  addTestActor,
  addTestGroup,
  addTestScores,
  addTestStudents,
} from "./test-fitness";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 16 October 2026.
const MOMENT = new Date("2026-10-16T03:00:00Z");
const TODAY = "2026-10-16";

/**
 * Ani, tested at 88, and Budi, not tested, who live in no dorm; Citra,
 * a Pembibitan student, who lives in Wismantara; and Dodi, Non aktif.
 */
async function addStudents(db: Database) {
  const { programId, studentIds } = await addTestStudents(
    db,
    "Prodi Uji Catatan Kesehatan",
    ["9986300201", "9986300202"],
  );
  const [ani = "", budi = ""] = studentIds;
  const citra = await addTestStudent(db, programId, {
    nim: "9986300203",
    name: "Citra Uji Asrama",
    isSeedling: true,
  });
  const dodi = await addTestStudent(db, programId, {
    nim: "9986300204",
    name: "Dodi Uji Nonaktif",
    status: "inactive",
  });
  const penilai = await addTestActor(db, "Penilai Uji Catatan", ["assessor"]);
  const groupId = await addTestGroup(db, programId, [ani]);
  await addTestScores(db, penilai, {
    groupId,
    testedOn: "2026-10-01",
    enteredAt: new Date("2026-10-01T03:00:00Z"),
    scores: [{ studentId: ani, score: 88 }],
  });
  return { programId, penilai, ids: { ani, budi, citra, dodi } };
}

function noteFor(studentId: string, more: Partial<SentNote> = {}): SentNote {
  return {
    studentId,
    examinedOn: TODAY,
    examiner: "",
    illnesses: ["asthma"],
    illnessNotes: ["sejak SMP"],
    otherHistory: "",
    medicine: "Inhaler bila perlu",
    advice: "Bawa inhaler saat kegiatan fisik.",
    category: "attention",
    ...more,
  };
}

async function keptNotes(db: Database) {
  return db.select().from(healthNotes);
}

describe("saveHealthNote", () => {
  it("keeps a note of a student who lives in no dorm, and says the more serious category", async () => {
    await inTestDatabase(async (db) => {
      const { penilai, ids } = await addStudents(db);

      const saved = await saveHealthNote(
        db,
        penilai,
        crypto.randomUUID(),
        noteFor(ids.ani),
        STARTING_LIMITS,
        MOMENT,
      );

      expect(saved).toEqual({
        ok: true,
        value: { name: "Mahasiswa Uji Jasmani 1", category: "attention" },
      });
      const [kept] = await keptNotes(db);
      expect(kept).toMatchObject({
        studentId: ids.ani,
        examinedOn: TODAY,
        examiner: null,
        medicine: "Inhaler bila perlu",
        category: "attention",
        savedBy: penilai.id,
      });
      const illnesses = await db.select().from(healthNoteIllnesses);
      expect(illnesses).toEqual([
        { noteId: kept?.id, illness: "asthma", note: "sejak SMP" },
      ]);
    });
  });

  it("says belum dites for a student with no test whose note follows the test", async () => {
    await inTestDatabase(async (db) => {
      const { penilai, ids } = await addStudents(db);

      const saved = await saveHealthNote(
        db,
        penilai,
        crypto.randomUUID(),
        noteFor(ids.budi, { category: "" }),
        STARTING_LIMITS,
        MOMENT,
      );

      expect(saved).toMatchObject({
        ok: true,
        value: { category: "untested" },
      });
    });
  });

  it("keeps a note saved again as the latest, and the earlier one as history", async () => {
    await inTestDatabase(async (db) => {
      const { penilai, ids } = await addStudents(db);
      await saveHealthNote(
        db,
        penilai,
        crypto.randomUUID(),
        noteFor(ids.budi, { advice: "Catatan pertama." }),
        STARTING_LIMITS,
        MOMENT,
      );
      await saveHealthNote(
        db,
        penilai,
        crypto.randomUUID(),
        noteFor(ids.budi, { examinedOn: "2026-10-01", advice: "Koreksi." }),
        STARTING_LIMITS,
        MOMENT,
      );

      const subject = await readHealthSubject(
        db,
        penilai,
        ids.budi,
        STARTING_LIMITS,
        TODAY,
      );
      expect(subject?.notes.map((note) => note.advice)).toEqual([
        "Koreksi.",
        "Catatan pertama.",
      ]);
    });
  });

  it.each<RoleId>([
    "director",
    "head_of_program",
    "mentor",
    "counsellor",
    "bam_health",
    "student",
  ])("refuses %s, keeping nothing", async (role) => {
    await inTestDatabase(async (db) => {
      const { programId, ids } = await addStudents(db);
      const actor = await addTestActor(db, "Bukan Penulis Uji", [role], {
        studyProgramId: programId,
      });

      const saved = await saveHealthNote(
        db,
        actor,
        crypto.randomUUID(),
        noteFor(ids.ani),
        STARTING_LIMITS,
        MOMENT,
      );

      expect(saved).toEqual(NOT_ALLOWED_TO_WRITE);
      expect(await keptNotes(db)).toEqual([]);
    });
  });

  it("refuses a dorm resident and a Non aktif student, keeping nothing", async () => {
    await inTestDatabase(async (db) => {
      const { penilai, ids } = await addStudents(db);

      for (const studentId of [ids.citra, ids.dodi]) {
        const saved = await saveHealthNote(
          db,
          penilai,
          crypto.randomUUID(),
          noteFor(studentId),
          STARTING_LIMITS,
          MOMENT,
        );
        expect(saved).toEqual(NOT_WRITABLE);
      }
      expect(await keptNotes(db)).toEqual([]);
    });
  });

  it("refuses a note with nothing in it, or with Tanggal after today", async () => {
    await inTestDatabase(async (db) => {
      const { penilai, ids } = await addStudents(db);
      const empty = noteFor(ids.ani, {
        illnesses: [],
        illnessNotes: [],
        medicine: "",
        advice: "",
      });

      const saves = [
        await saveHealthNote(
          db,
          penilai,
          crypto.randomUUID(),
          empty,
          STARTING_LIMITS,
          MOMENT,
        ),
        await saveHealthNote(
          db,
          penilai,
          crypto.randomUUID(),
          noteFor(ids.ani, { examinedOn: "2026-10-17" }),
          STARTING_LIMITS,
          MOMENT,
        ),
      ];

      expect(saves).toEqual([
        { ok: false, error: NO_NOTE },
        { ok: false, error: NOTE_DAY_IN_FUTURE },
      ]);
      expect(await keptNotes(db)).toEqual([]);
    });
  });

  it("keeps a form sent twice once, and refuses a changed form sent with the same key", async () => {
    await inTestDatabase(async (db) => {
      const { penilai, ids } = await addStudents(db);
      const id = crypto.randomUUID();
      const sent = noteFor(ids.ani);

      const first = await saveHealthNote(
        db,
        penilai,
        id,
        sent,
        STARTING_LIMITS,
        MOMENT,
      );
      const again = await saveHealthNote(
        db,
        penilai,
        id,
        sent,
        STARTING_LIMITS,
        MOMENT,
      );
      const changed = await saveHealthNote(
        db,
        penilai,
        id,
        { ...sent, illnessNotes: ["sejak SD"] },
        STARTING_LIMITS,
        MOMENT,
      );

      expect(again).toEqual(first);
      expect(changed).toEqual(NOTE_ALREADY_SENT);
      expect(await keptNotes(db)).toHaveLength(1);
    });
  });
});

describe("mayWriteNotes", () => {
  it.each<[RoleId, boolean]>([
    ["head_of_unit", true],
    ["assessor", true],
    ["director", false],
    ["head_of_program", false],
    ["mentor", false],
    ["counsellor", false],
    ["bam_health", false],
    ["bam_bphk", false],
    ["dorm_manager", false],
    ["upk_staff", false],
    ["student", false],
  ])("gives %s the form: %s", (role, writes) => {
    expect(mayWriteNotes([role])).toBe(writes);
  });
});

describe("searchHealthStudents", () => {
  it("offers only Aktif students who live in no dorm", async () => {
    await inTestDatabase(async (db) => {
      const { penilai, ids } = await addStudents(db);

      const found = await searchHealthStudents(db, penilai, "99863002", TODAY);

      expect(found.map((pick) => pick.id).sort()).toEqual(
        [ids.ani, ids.budi].sort(),
      );
    });
  });

  it("offers nobody to a role that may not write notes", async () => {
    await inTestDatabase(async (db) => {
      await addStudents(db);
      const direktur = await addTestActor(db, "Direktur Uji Catatan", [
        "director",
      ]);

      expect(
        await searchHealthStudents(db, direktur, "99863002", TODAY),
      ).toEqual([]);
    });
  });
});

describe("readHealthSubject", () => {
  it("gives the test category and the notes of a student the writer may pick", async () => {
    await inTestDatabase(async (db) => {
      const { penilai, ids } = await addStudents(db);
      await saveHealthNote(
        db,
        penilai,
        crypto.randomUUID(),
        noteFor(ids.ani),
        STARTING_LIMITS,
        MOMENT,
      );

      const subject = await readHealthSubject(
        db,
        penilai,
        ids.ani,
        STARTING_LIMITS,
        TODAY,
      );

      expect(subject).toEqual({
        test: "excellent",
        notes: [
          expect.objectContaining({
            illnesses: [{ illness: "asthma", note: "sejak SMP" }],
            category: "attention",
            savedBy: "Penilai Uji Catatan",
          }),
        ],
      });
    });
  });

  it("gives nothing of a dorm resident, nor to Direktur or Pengasuh", async () => {
    await inTestDatabase(async (db) => {
      const { penilai, ids } = await addStudents(db);
      await db
        .update(students)
        .set({ isSeedling: true })
        .where(eq(students.id, ids.budi));
      const direktur = await addTestActor(db, "Direktur Uji Catatan", [
        "director",
      ]);
      const pengasuh = await addTestActor(db, "Pengasuh Uji Catatan", [
        "mentor",
      ]);

      for (const [actor, studentId] of [
        [penilai, ids.budi],
        [direktur, ids.ani],
        [pengasuh, ids.ani],
      ] as const) {
        expect(
          await readHealthSubject(db, actor, studentId, STARTING_LIMITS, TODAY),
        ).toBeNull();
      }
    });
  });
});
