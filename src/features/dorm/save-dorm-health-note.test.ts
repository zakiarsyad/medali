// Sample NIMs of this file: 9986300700 to 9986300799.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { healthNoteIllnesses, healthNotes } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import { STARTING_LIMITS } from "@/health-notes/fitness-ids";
import {
  NO_NOTE,
  NOTE_DAY_IN_FUTURE,
  type SentNote,
} from "@/health-notes/health-input";
import { NOTE_ALREADY_SENT } from "@/health-notes/save-note";
import { readDormHealthList } from "./dorm-health";
import { DORM_HEALTH_START } from "./dorm-health-address";
import {
  mayWriteDormNotes,
  readDormHealthSubject,
  searchDormHealthStudents,
} from "./dorm-health-subject";
import {
  NOT_A_RESIDENT,
  NOT_ALLOWED_TO_WRITE_DORM,
  saveDormHealthNote,
} from "./save-dorm-health-note";
import {
  addHealthActor,
  addHealthGroup,
  addHealthScores,
  type HealthActor,
} from "./test-health";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 16 October 2026.
const MOMENT = new Date("2026-10-16T03:00:00Z");
const TODAY = "2026-10-16";

/**
 * With no academic period running, only Pembibitan and Internasional
 * students live in the dorm: Ani, Pembibitan, tested at 88; Budi,
 * Internasional, not tested; Citra, who lives in no dorm; and Dodi,
 * Pembibitan and Non aktif. BAM - Kesehatan writes the notes.
 */
async function addStudents(db: Database) {
  const programId = await addTestProgram(db, "Prodi Uji Catatan Asrama");
  const add = (nim: string, name: string, more = {}) =>
    addTestStudent(db, programId, { nim, name, ...more });
  const ani = await add("9986300701", "Ani Catatan Asrama", {
    isSeedling: true,
  });
  const budi = await add("9986300702", "Budi Catatan Asrama", {
    isInternational: true,
    sex: "male",
  });
  const citra = await add("9986300703", "Citra Luar Asrama");
  const dodi = await add("9986300704", "Dodi Catatan Nonaktif", {
    isSeedling: true,
    status: "inactive",
  });
  const bam = await addHealthActor(db, "BAM Kesehatan Uji", ["bam_health"]);
  const groupId = await addHealthGroup(db, programId, [ani]);
  await addHealthScores(db, bam, groupId, [{ studentId: ani, score: 88 }]);
  return { programId, bam, ids: { ani, budi, citra, dodi } };
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

function save(
  db: Database,
  actor: HealthActor,
  sent: SentNote,
  id: string = crypto.randomUUID(),
) {
  return saveDormHealthNote(db, actor, id, sent, STARTING_LIMITS, MOMENT);
}

async function keptNotes(db: Database) {
  return db.select().from(healthNotes);
}

describe("saveDormHealthNote", () => {
  it("keeps a note of a resident, and says the more serious category", async () => {
    await inTestDatabase(async (db) => {
      const { bam, ids } = await addStudents(db);

      const saved = await save(db, bam, noteFor(ids.ani));

      expect(saved).toEqual({
        ok: true,
        value: {
          name: "Ani Catatan Asrama",
          category: "attention",
          markSaved: false,
        },
      });
      const [kept] = await keptNotes(db);
      expect(kept).toMatchObject({
        studentId: ids.ani,
        examinedOn: TODAY,
        category: "attention",
        savedBy: bam.id,
      });
      expect(await db.select().from(healthNoteIllnesses)).toEqual([
        { noteId: kept?.id, illness: "asthma", note: "sejak SMP" },
      ]);
    });
  });

  it("lets Kepala Unit write a resident's note too", async () => {
    await inTestDatabase(async (db) => {
      const { ids } = await addStudents(db);
      const kepala = await addHealthActor(db, "Kepala Uji Catatan", [
        "head_of_unit",
      ]);

      const saved = await save(db, kepala, noteFor(ids.budi, { category: "" }));

      expect(saved).toMatchObject({
        ok: true,
        value: { category: "untested" },
      });
    });
  });

  it.each<RoleId>([
    "dorm_manager",
    "bam_bphk",
    "mentor",
    "director",
    "head_of_program",
    "assessor",
    "bam_compliance",
    "counsellor",
    "student",
  ])("refuses a hand-made note sent by %s, keeping nothing", async (role) => {
    await inTestDatabase(async (db) => {
      const { programId, ids } = await addStudents(db);
      const actor = await addHealthActor(
        db,
        "Bukan Penulis Asrama",
        [role],
        programId,
      );

      expect(await save(db, actor, noteFor(ids.ani))).toEqual(
        NOT_ALLOWED_TO_WRITE_DORM,
      );
      expect(await keptNotes(db)).toEqual([]);
    });
  });

  it("refuses a student who lives in no dorm and a Non aktif resident, keeping nothing", async () => {
    await inTestDatabase(async (db) => {
      const { bam, ids } = await addStudents(db);

      for (const studentId of [ids.citra, ids.dodi]) {
        expect(await save(db, bam, noteFor(studentId))).toEqual(NOT_A_RESIDENT);
      }
      expect(await save(db, bam, noteFor("bukan-kunci"))).toEqual(
        NOT_A_RESIDENT,
      );
      expect(await keptNotes(db)).toEqual([]);
    });
  });

  it("refuses no student, a note with nothing in it, and Tanggal after today", async () => {
    await inTestDatabase(async (db) => {
      const { bam, ids } = await addStudents(db);
      const empty = noteFor(ids.ani, {
        illnesses: [],
        illnessNotes: [],
        medicine: "",
        advice: "",
      });

      expect(await save(db, bam, noteFor(""))).toEqual(NOT_A_RESIDENT);
      expect(await save(db, bam, empty)).toEqual({ ok: false, error: NO_NOTE });
      expect(
        await save(db, bam, noteFor(ids.ani, { examinedOn: "2026-10-17" })),
      ).toEqual({ ok: false, error: NOTE_DAY_IN_FUTURE });
      expect(await keptNotes(db)).toEqual([]);
    });
  });

  it("keeps a form sent twice once, and refuses a changed form sent with the same key", async () => {
    await inTestDatabase(async (db) => {
      const { bam, ids } = await addStudents(db);
      const id = crypto.randomUUID();

      const first = await save(db, bam, noteFor(ids.ani), id);
      const again = await save(db, bam, noteFor(ids.ani), id);
      const changed = await save(
        db,
        bam,
        noteFor(ids.ani, { advice: "Lain." }),
        id,
      );

      expect(again).toEqual(first);
      expect(changed).toEqual(NOTE_ALREADY_SENT);
      expect(await keptNotes(db)).toHaveLength(1);
    });
  });

  it("keeps the notes of two writers for one resident, and the newer counts in the list", async () => {
    await inTestDatabase(async (db) => {
      const { bam, ids } = await addStudents(db);
      const kepala = await addHealthActor(db, "Kepala Uji Berdua", [
        "head_of_unit",
      ]);

      await save(db, bam, noteFor(ids.ani, { advice: "Catatan BAM." }));
      await save(
        db,
        kepala,
        noteFor(ids.ani, {
          examinedOn: "2026-10-01",
          illnesses: [],
          illnessNotes: [],
          medicine: "",
          advice: "Catatan Kepala.",
          category: "medical",
        }),
      );

      const subject = await readDormHealthSubject(
        db,
        bam,
        ids.ani,
        STARTING_LIMITS,
        TODAY,
      );
      expect(subject?.notes.map((note) => note.advice)).toEqual([
        "Catatan Kepala.",
        "Catatan BAM.",
      ]);
      const found = await readDormHealthList(
        db,
        bam,
        DORM_HEALTH_START,
        STARTING_LIMITS,
        TODAY,
      );
      const [row] = found?.list.rows ?? [];
      expect(row?.note?.advice).toBe("Catatan Kepala.");
      expect(row?.final.category).toBe("medical");
    });
  });

  it("adds a line to the log for every note, with who saved it and when, never changed", async () => {
    await inTestDatabase(async (db) => {
      const { bam, ids } = await addStudents(db);

      await save(db, bam, noteFor(ids.ani, { advice: "Satu." }));
      await save(db, bam, noteFor(ids.ani, { advice: "Dua." }));

      const lines = await db
        .select({
          advice: healthNotes.advice,
          savedBy: healthNotes.savedBy,
          savedAt: healthNotes.savedAt,
        })
        .from(healthNotes)
        .where(eq(healthNotes.studentId, ids.ani));
      expect(lines.map((line) => line.advice).sort()).toEqual([
        "Dua.",
        "Satu.",
      ]);
      for (const line of lines) {
        expect(line.savedBy).toBe(bam.id);
        expect(line.savedAt).toBeInstanceOf(Date);
      }
      await expect(
        db.transaction((tx) =>
          tx.update(healthNotes).set({ advice: "Diubah." }),
        ),
      ).rejects.toThrow();
      await expect(
        db.transaction((tx) => tx.delete(healthNotes)),
      ).rejects.toThrow();
    });
  });
});

describe("the residents a writer may pick", () => {
  it("are the Aktif residents, for Kepala Unit and BAM - Kesehatan alone", async () => {
    await inTestDatabase(async (db) => {
      const { programId, bam } = await addStudents(db);
      const manager = await addHealthActor(
        db,
        "Pengelola Uji Catatan",
        ["dorm_manager"],
        programId,
      );

      const found = await searchDormHealthStudents(db, bam, "Catatan", TODAY);
      expect(found.map((pick) => pick.name)).toEqual([
        "Ani Catatan Asrama",
        "Budi Catatan Asrama",
      ]);
      expect(
        await searchDormHealthStudents(db, manager, "Catatan", TODAY),
      ).toEqual([]);
      expect(mayWriteDormNotes(["bam_health"])).toBe(true);
      expect(mayWriteDormNotes(["head_of_unit"])).toBe(true);
      expect(mayWriteDormNotes(["dorm_manager"])).toBe(false);
      expect(mayWriteDormNotes(["assessor"])).toBe(false);
    });
  });

  it("give the test category and the notes of a resident, and nothing of anyone else", async () => {
    await inTestDatabase(async (db) => {
      const { programId, bam, ids } = await addStudents(db);
      await save(db, bam, noteFor(ids.ani));
      const director = await addHealthActor(
        db,
        "Direktur Uji Catatan",
        ["director"],
        programId,
      );

      const subject = await readDormHealthSubject(
        db,
        bam,
        ids.ani,
        STARTING_LIMITS,
        TODAY,
      );
      expect(subject?.test).toBe("excellent");
      expect(subject?.notes).toHaveLength(1);
      for (const studentId of [ids.citra, ids.dodi, "bukan-kunci"]) {
        expect(
          await readDormHealthSubject(
            db,
            bam,
            studentId,
            STARTING_LIMITS,
            TODAY,
          ),
        ).toBeNull();
      }
      expect(
        await readDormHealthSubject(
          db,
          director,
          ids.ani,
          STARTING_LIMITS,
          TODAY,
        ),
      ).toBeNull();
    });
  });
});
