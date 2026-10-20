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
import { NOTE_ALREADY_SENT } from "@/health-notes/save-note";
import { addTestNote } from "@/health-notes/test-health";
import type { SentMark } from "./mental-health-mark-input";
import { REFERRAL_NEEDS_OBSERVATION } from "./mental-health-mark-words";
import { readMarkLog, readMarkOf } from "./mental-health-marks";
import {
  NOT_A_RESIDENT,
  NOT_ALLOWED_TO_WRITE_DORM,
  OWN_MARK,
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

/** A choice of "Kategori potensi" with its observation, as typed. */
interface Choice {
  category: string;
  observation: string;
}

const WATCH: Choice = { category: "monitor", observation: "Sulit tidur." };
const REFER: Choice = { category: "refer", observation: "Menarik diri." };
const NONE: Choice = { category: "", observation: "" };

/** The mark part sent: the choice made, on a form filled with `from`. */
function sentMark(to: Choice, from: Choice = NONE): SentMark {
  return {
    ...to,
    filledCategory: from.category,
    filledObservation: from.observation,
  };
}

function save(
  db: Database,
  actor: HealthActor,
  sent: SentNote,
  to: Choice,
  {
    id = crypto.randomUUID(),
    from = NONE,
  }: { id?: string; from?: Choice } = {},
) {
  return saveDormHealthNote(
    db,
    actor,
    id,
    sent,
    STARTING_LIMITS,
    MOMENT,
    sentMark(to, from),
  );
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

      const cleared = await save(
        db,
        bam,
        emptyNote(ids.ani),
        { category: "", observation: "Masih tertulis." },
        { from: REFER },
      );

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

      const first = await save(db, bam, budiFilled(ids.budi), WATCH, {
        id: key,
      });
      const second = await save(db, bam, budiFilled(ids.budi), WATCH, {
        id: key,
      });

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

describe("a mark of one's own", () => {
  it("is refused to BAM - Kesehatan who is that resident, keeping nothing, while their own note is kept as before", async () => {
    await inTestDatabase(async (db) => {
      const { bam, ids } = await addStudents(db);
      const own: HealthActor = { ...bam, studentId: ids.ani };

      const saved = await save(db, own, emptyNote(ids.ani), WATCH);
      const noteOnly = await saveDormHealthNote(
        db,
        own,
        crypto.randomUUID(),
        { ...emptyNote(ids.ani), advice: "Istirahat." },
        STARTING_LIMITS,
        MOMENT,
      );

      expect(saved).toEqual(OWN_MARK);
      expect(await storedMarks(db)).toEqual([]);
      expect(noteOnly).toMatchObject({ ok: true, value: { markSaved: false } });
    });
  });
});

describe("a mark changed by another writer while the form was open", () => {
  it("is left alone by a save of the note only, and replaced by a later change of the mark", async () => {
    await inTestDatabase(async (db) => {
      const { bam, kepala, ids } = await addStudents(db);
      await save(db, kepala, emptyNote(ids.ani), REFER);

      const noteOnly = await save(
        db,
        bam,
        { ...emptyNote(ids.ani), advice: "Istirahat." },
        NONE,
      );

      expect(noteOnly).toMatchObject({ ok: true, value: { markSaved: false } });
      expect(await storedMarks(db)).toMatchObject([
        { category: "refer", changedBy: kepala.id },
      ]);

      await save(db, bam, emptyNote(ids.ani), WATCH);

      expect(await storedMarks(db)).toMatchObject([
        { category: "monitor", changedBy: bam.id },
      ]);
    });
  });
});

describe("a form key used for the mark of another student", () => {
  it("refuses a change of another student's mark as sent already, keeping nothing", async () => {
    await inTestDatabase(async (db) => {
      const { bam, ids } = await addStudents(db);
      const key = crypto.randomUUID();
      await save(db, bam, emptyNote(ids.ani), WATCH, { id: key });

      const again = await save(db, bam, emptyNote(ids.budi), REFER, {
        id: key,
      });

      expect(again).toEqual(NOTE_ALREADY_SENT);
      expect(await readMarkOf(db, bam, ids.budi)).toBeNull();
      expect(await db.select().from(mentalHealthMarkChanges)).toHaveLength(1);
    });
  });

  it("never answers saved for another student whose mark is left alone", async () => {
    await inTestDatabase(async (db) => {
      const { bam, ids } = await addStudents(db);
      const key = crypto.randomUUID();
      await save(db, bam, emptyNote(ids.ani), WATCH, { id: key });

      const again = await save(db, bam, budiFilled(ids.budi), NONE, {
        id: key,
      });

      expect(again).toEqual(NOTE_ALREADY_SENT);
      expect(await db.select().from(healthNotes)).toHaveLength(1);
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
      await save(db, bam, emptyNote(ids.ani), NONE, { from: REFER });

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
