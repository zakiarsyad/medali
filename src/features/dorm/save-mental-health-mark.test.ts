// Sample NIMs of this file: 9986400100 to 9986400199.
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  healthNotes,
  mentalHealthMarkChanges,
  mentalHealthMarks,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import { STARTING_LIMITS } from "@/health-notes/fitness-ids";
import { NO_NOTE, type SentNote } from "@/health-notes/health-input";
import { addTestNote } from "@/health-notes/test-health";
import type { SentMark } from "./mental-health-mark-input";
import { REFERRAL_NEEDS_OBSERVATION } from "./mental-health-mark-words";
import { readMarkLog, readMarkOf } from "./mental-health-marks";
import {
  NOT_A_RESIDENT,
  NOT_ALLOWED_TO_WRITE_DORM,
  saveDormHealthNote,
} from "./save-dorm-health-note";
import { addHealthActor, type HealthActor } from "./test-health";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 16 October 2026.
const MOMENT = new Date("2026-10-16T03:00:00Z");
const TODAY = "2026-10-16";

/**
 * With no academic period running, only Pembibitan students live in the
 * dorm: Ani, a resident with no note; Budi, a resident with a note on
 * asthma; Citra, who lives in no dorm.
 */
async function addStudents(db: Database) {
  const programId = await addTestProgram(db, "Prodi Uji Penanda Asrama");
  const add = (nim: string, name: string, more = {}) =>
    addTestStudent(db, programId, { nim, name, ...more });
  const ani = await add("9986400101", "Ani Penanda", { isSeedling: true });
  const budi = await add("9986400102", "Budi Penanda", {
    isSeedling: true,
    sex: "male",
  });
  const citra = await add("9986400103", "Citra Penanda Luar");
  const bam = await addHealthActor(db, "BAM Kesehatan Penanda", ["bam_health"]);
  const kepala = await addHealthActor(db, "Kepala Penanda", ["head_of_unit"]);
  await addTestNote(db, kepala, {
    studentId: budi,
    savedAt: new Date("2026-10-12T03:00:00Z"),
    illnesses: [{ illness: "asthma", note: "sejak SMP" }],
    medicine: "Inhaler bila perlu",
    advice: "Bawa inhaler.",
    category: "attention",
  });
  return { bam, kepala, ids: { ani, budi, citra } };
}

/** The note part as the form sends it for a student with no note. */
function emptyNote(studentId: string): SentNote {
  return {
    studentId,
    examinedOn: TODAY,
    examiner: "",
    illnesses: [],
    illnessNotes: [],
    otherHistory: "",
    medicine: "",
    advice: "",
    category: "",
  };
}

/** The note part as the form is filled from Budi's note. */
function budiFilled(studentId: string): SentNote {
  return {
    ...emptyNote(studentId),
    illnesses: ["asthma"],
    illnessNotes: ["sejak SMP"],
    medicine: "Inhaler bila perlu",
    advice: "Bawa inhaler.",
    category: "attention",
  };
}

const WATCH: SentMark = { category: "monitor", observation: "Sulit tidur." };
const REFER: SentMark = { category: "refer", observation: "Menarik diri." };
const NONE: SentMark = { category: "", observation: "" };

function save(
  db: Database,
  actor: HealthActor,
  sent: SentNote,
  mark: SentMark,
  id: string = crypto.randomUUID(),
) {
  return saveDormHealthNote(db, actor, id, sent, STARTING_LIMITS, MOMENT, mark);
}

async function storedMarks(db: Database) {
  return db
    .select({
      studentId: mentalHealthMarks.studentId,
      category: mentalHealthMarks.category,
      observation: mentalHealthMarks.observation,
      changedBy: mentalHealthMarks.changedBy,
    })
    .from(mentalHealthMarks);
}

describe("saveDormHealthNote with a mental health mark", () => {
  it("keeps a mark with no illness and no note, and keeps no empty note", async () => {
    await inTestDatabase(async (db) => {
      const { bam, ids } = await addStudents(db);

      const saved = await save(db, bam, emptyNote(ids.ani), WATCH);

      expect(saved).toEqual({
        ok: true,
        value: { name: "Ani Penanda", category: null, markSaved: true },
      });
      expect(await storedMarks(db)).toEqual([
        {
          studentId: ids.ani,
          category: "monitor",
          observation: "Sulit tidur.",
          changedBy: bam.id,
        },
      ]);
      const notes = await db.select().from(healthNotes);
      expect(notes.map((note) => note.studentId)).toEqual([ids.budi]);
    });
  });

  it("refuses a referral to the counsellor with no observation, keeping nothing, a note neither", async () => {
    await inTestDatabase(async (db) => {
      const { bam, ids } = await addStudents(db);
      const note = { ...emptyNote(ids.ani), advice: "Istirahat." };

      const saved = await save(db, bam, note, { ...REFER, observation: " " });

      expect(saved).toEqual({ ok: false, error: REFERRAL_NEEDS_OBSERVATION });
      expect(await storedMarks(db)).toEqual([]);
      expect(await db.select().from(healthNotes)).toHaveLength(1);
    });
  });

  it("changes the mark, and clears it and its observation with Tidak ada indikasi", async () => {
    await inTestDatabase(async (db) => {
      const { bam, kepala, ids } = await addStudents(db);
      await save(db, bam, emptyNote(ids.ani), WATCH);
      await save(db, kepala, emptyNote(ids.ani), REFER);

      expect(await readMarkOf(db, bam, ids.ani)).toEqual({
        category: "refer",
        observation: "Menarik diri.",
      });

      const cleared = await save(db, bam, emptyNote(ids.ani), {
        category: "",
        observation: "Masih tertulis.",
      });

      expect(cleared).toMatchObject({ ok: true, value: { markSaved: true } });
      expect(await storedMarks(db)).toEqual([
        {
          studentId: ids.ani,
          category: null,
          observation: "",
          changedBy: bam.id,
        },
      ]);
      expect(await readMarkOf(db, bam, ids.ani)).toBeNull();
    });
  });

  it("sets only the mark when the note part is the latest note as filled, with no copy of it", async () => {
    await inTestDatabase(async (db) => {
      const { bam, ids } = await addStudents(db);

      const saved = await save(db, bam, budiFilled(ids.budi), WATCH);

      expect(saved).toEqual({
        ok: true,
        value: { name: "Budi Penanda", category: null, markSaved: true },
      });
      expect(await db.select().from(healthNotes)).toHaveLength(1);
    });
  });

  it("keeps a changed note and the mark together", async () => {
    await inTestDatabase(async (db) => {
      const { bam, ids } = await addStudents(db);
      const changed = { ...budiFilled(ids.budi), advice: "Kontrol ke klinik." };

      const saved = await save(db, bam, changed, WATCH);

      expect(saved).toEqual({
        ok: true,
        value: { name: "Budi Penanda", category: "attention", markSaved: true },
      });
      expect(await db.select().from(healthNotes)).toHaveLength(2);
      expect(await storedMarks(db)).toHaveLength(1);
    });
  });

  it("keeps the note rules when the mark does not change: a note is saved, an empty one refused", async () => {
    await inTestDatabase(async (db) => {
      const { bam, ids } = await addStudents(db);

      const repeated = await save(db, bam, budiFilled(ids.budi), NONE);
      const empty = await save(db, bam, emptyNote(ids.ani), NONE);

      expect(repeated).toEqual({
        ok: true,
        value: {
          name: "Budi Penanda",
          category: "attention",
          markSaved: false,
        },
      });
      expect(empty).toEqual({ ok: false, error: NO_NOTE });
      expect(await db.select().from(healthNotes)).toHaveLength(2);
      expect(await db.select().from(mentalHealthMarkChanges)).toEqual([]);
    });
  });

  it("keeps a form sent twice once, and answers the second press as the first", async () => {
    await inTestDatabase(async (db) => {
      const { bam, ids } = await addStudents(db);
      const key = crypto.randomUUID();

      const first = await save(db, bam, budiFilled(ids.budi), WATCH, key);
      const second = await save(db, bam, budiFilled(ids.budi), WATCH, key);

      expect(second).toEqual(first);
      expect(await db.select().from(mentalHealthMarkChanges)).toHaveLength(1);
      expect(await db.select().from(healthNotes)).toHaveLength(1);
    });
  });

  it.each<RoleId>([
    "dorm_manager",
    "mentor",
    "bam_bphk",
    "director",
    "student",
  ])("refuses a hand-made mark from %s, keeping nothing", async (role) => {
    await inTestDatabase(async (db) => {
      const { ids } = await addStudents(db);
      const actor = await addHealthActor(db, "Pembaca Uji Penanda", [role]);

      const saved = await save(db, actor, emptyNote(ids.ani), REFER);

      expect(saved).toEqual(NOT_ALLOWED_TO_WRITE_DORM);
      expect(await storedMarks(db)).toEqual([]);
    });
  });

  it("refuses a student who lives in no dorm, keeping nothing", async () => {
    await inTestDatabase(async (db) => {
      const { bam, ids } = await addStudents(db);

      const saved = await save(db, bam, emptyNote(ids.citra), WATCH);

      expect(saved).toEqual(NOT_A_RESIDENT);
      expect(await storedMarks(db)).toEqual([]);
    });
  });
});

describe("the log of a mark", () => {
  it("has a line for every change with who, when, before and after, for Kepala Unit alone", async () => {
    await inTestDatabase(async (db) => {
      const { bam, kepala, ids } = await addStudents(db);
      await save(db, bam, emptyNote(ids.ani), WATCH);
      await save(db, kepala, emptyNote(ids.ani), REFER);
      await save(db, kepala, emptyNote(ids.ani), REFER);
      await save(db, bam, emptyNote(ids.ani), NONE);

      const log = await readMarkLog(db, kepala, ids.ani);

      expect(log?.map(({ changedAt: _, ...line }) => line)).toEqual([
        {
          changedBy: "BAM Kesehatan Penanda",
          before: { category: "refer", observation: "Menarik diri." },
          after: { category: null, observation: "" },
        },
        {
          changedBy: "Kepala Penanda",
          before: { category: "monitor", observation: "Sulit tidur." },
          after: { category: "refer", observation: "Menarik diri." },
        },
        {
          changedBy: "BAM Kesehatan Penanda",
          before: { category: null, observation: "" },
          after: { category: "monitor", observation: "Sulit tidur." },
        },
      ]);
      for (const role of ["bam_health", "dorm_manager", "mentor"] as const) {
        const reader = await addHealthActor(db, "Pembaca Log Uji", [role]);
        expect(await readMarkLog(db, reader, ids.ani)).toBeNull();
      }
    });
  });
});
