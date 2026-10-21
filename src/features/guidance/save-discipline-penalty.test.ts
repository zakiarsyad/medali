// Sample Tahun akademik of this file: 4421 to 4421.
// Sample NIMs of this file: 9944230000 to 9944230099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { disciplinePenalties, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { DAY_IN_FUTURE, DAY_IN_NO_PERIOD } from "./note-input";
import { NEEDS_CONFIRMATION, type SentPenalty } from "./penalty-input";
import {
  NOT_ALLOWED_TO_RECORD,
  NOT_RECORDABLE,
  PENALTY_ALREADY_SENT,
  PLACE_NEEDS_AGENCY,
} from "./penalty-messages";
import { saveDisciplinePenalty } from "./save-discipline-penalty";
import { penaltyAt, penaltyLinesOf } from "./test-discipline-penalties";
import {
  addNoteActor,
  addNotePeriods,
  addNoteStudents,
} from "./test-violation-notes";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 20 October 4421, in Ganjil 4421/4422.
const MOMENT = new Date("4421-10-20T03:00:00Z");

async function setting(db: Database) {
  await addNotePeriods(db, 4421);
  const { studentIds, programId } = await addNoteStudents(
    db,
    "Prodi Uji Simpan Hukuman",
    "Mahasiswa Uji Simpan Hukuman",
    ["9944230001", "9944230002", "9944230003"],
  );
  const officer = await addNoteActor(db, "Pembina Uji Simpan Hukuman", [
    "discipline_officer",
  ]);
  return { officer, studentIds, programId };
}

function sent(studentId: string, more: Partial<SentPenalty> = {}): SentPenalty {
  return {
    studentId,
    day: "4421-10-18",
    description: "Terlambat mengikuti apel pagi tiga kali.",
    category: "light",
    level: "2",
    decisionNumber: "",
    socialWorkForms: ["traffic"],
    socialWorkOther: "",
    socialWorkPlace: "campus",
    socialWorkStart: "4421-10-21",
    confirmed: false,
    ...more,
  };
}

describe("saveDisciplinePenalty", () => {
  it("keeps the penalty as Dijatuhkan, the work of the one who saved, with its kerja sosial and a line in the log", async () => {
    await inTestDatabase(async (db) => {
      const { officer, studentIds } = await setting(db);
      const [one = ""] = studentIds;
      const id = crypto.randomUUID();

      const saved = await saveDisciplinePenalty(
        db,
        officer,
        id,
        sent(one),
        MOMENT,
      );

      expect(saved).toEqual({
        ok: true,
        value: { name: "Mahasiswa Uji Simpan Hukuman 1", status: "imposed" },
      });
      expect(await penaltyAt(db, id)).toEqual(
        expect.objectContaining({
          studentId: one,
          category: "light",
          level: 2,
          status: "imposed",
          socialWorkForms: ["traffic"],
          socialWorkStartsOn: "4421-10-21",
          socialWorkEndsOn: "4421-10-30",
          savedBy: officer.id,
        }),
      );
      const lines = await penaltyLinesOf(db, id);
      expect(lines.map((line) => [line.action, line.changedBy])).toEqual([
        ["added", officer.id],
      ]);
    });
  });

  it("keeps a penalty that ends the status as Ditetapkan once ticked, and refuses it unticked", async () => {
    await inTestDatabase(async (db) => {
      const { officer, studentIds } = await setting(db);
      const [one = ""] = studentIds;
      const dismissal = { category: "heavy", level: "3" };

      const unticked = await saveDisciplinePenalty(
        db,
        officer,
        crypto.randomUUID(),
        sent(one, dismissal),
        MOMENT,
      );
      const ticked = await saveDisciplinePenalty(
        db,
        officer,
        crypto.randomUUID(),
        sent(one, { ...dismissal, confirmed: true }),
        MOMENT,
      );

      expect(unticked).toEqual({ ok: false, error: NEEDS_CONFIRMATION });
      expect(ticked.ok && ticked.value.status).toBe("set");
    });
  });

  it("offers kerja sosial at the Instansi asal only to a student who has one", async () => {
    await inTestDatabase(async (db) => {
      const { officer, studentIds } = await setting(db);
      const [one = "", two = ""] = studentIds;
      await db
        .update(students)
        .set({ originAgency: "Instansi Uji" })
        .where(eq(students.id, one));
      const atAgency = { socialWorkPlace: "home_agency" };

      const withAgency = await saveDisciplinePenalty(
        db,
        officer,
        crypto.randomUUID(),
        sent(one, atAgency),
        MOMENT,
      );
      const without = await saveDisciplinePenalty(
        db,
        officer,
        crypto.randomUUID(),
        sent(two, atAgency),
        MOMENT,
      );

      expect(withAgency.ok).toBe(true);
      expect(without).toEqual(PLACE_NEEDS_AGENCY);
    });
  });

  it.each([
    ["a future Tanggal", { day: "4421-10-21" }, DAY_IN_FUTURE],
    ["a Tanggal in no period", { day: "4421-07-31" }, DAY_IN_NO_PERIOD],
  ])("keeps nothing for %s", async (_, more, error) => {
    await inTestDatabase(async (db) => {
      const { officer, studentIds } = await setting(db);
      const id = crypto.randomUUID();

      const saved = await saveDisciplinePenalty(
        db,
        officer,
        id,
        sent(studentIds[0] ?? "", more),
        MOMENT,
      );

      expect(saved).toEqual({ ok: false, error });
      expect(await penaltyAt(db, id)).toBeUndefined();
    });
  });

  it("refuses a student on Cuti, and one outside the rows of the one who saves", async () => {
    await inTestDatabase(async (db) => {
      const { officer, studentIds } = await setting(db);
      await db
        .update(students)
        .set({ status: "on_leave" })
        .where(eq(students.id, studentIds[2] ?? ""));

      const onLeave = await saveDisciplinePenalty(
        db,
        officer,
        crypto.randomUUID(),
        sent(studentIds[2] ?? ""),
        MOMENT,
      );
      const unknown = await saveDisciplinePenalty(
        db,
        officer,
        crypto.randomUUID(),
        sent(crypto.randomUUID()),
        MOMENT,
      );

      expect(onLeave).toEqual(NOT_RECORDABLE);
      expect(unknown).toEqual(NOT_RECORDABLE);
    });
  });

  it.each<RoleId>(["director", "head_of_program", "mentor", "student"])(
    "refuses a hand-made save from %s, keeping nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { studentIds, programId } = await setting(db);
        const reader = await addNoteActor(
          db,
          "Pembaca Uji Simpan Hukuman",
          [role],
          programId,
        );
        const id = crypto.randomUUID();

        const saved = await saveDisciplinePenalty(
          db,
          reader,
          id,
          sent(studentIds[0] ?? ""),
          MOMENT,
        );

        expect(saved).toEqual(NOT_ALLOWED_TO_RECORD);
        expect(await penaltyAt(db, id)).toBeUndefined();
      });
    },
  );

  it("keeps a form sent twice once, answers the second press as the first, and refuses the key with other contents", async () => {
    await inTestDatabase(async (db) => {
      const { officer, studentIds } = await setting(db);
      const [one = ""] = studentIds;
      const id = crypto.randomUUID();

      const first = await saveDisciplinePenalty(
        db,
        officer,
        id,
        sent(one),
        MOMENT,
      );
      const again = await saveDisciplinePenalty(
        db,
        officer,
        id,
        sent(one),
        MOMENT,
      );
      const changed = await saveDisciplinePenalty(
        db,
        officer,
        id,
        sent(one, { description: "Uraian yang diubah setelah terkirim." }),
        MOMENT,
      );

      expect(again).toEqual(first);
      expect(changed).toEqual(PENALTY_ALREADY_SENT);
      const kept = await db
        .select()
        .from(disciplinePenalties)
        .where(eq(disciplinePenalties.studentId, one));
      expect(kept).toHaveLength(1);
      expect(await penaltyLinesOf(db, id)).toHaveLength(1);
    });
  });
});
