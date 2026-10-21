// Sample NIMs of this file: 9988720000 to 9988720099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { mentalHealthMarks } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestProgram,
  addTestRoom,
  addTestStudent,
  placeTestResident,
} from "@/dorms/test-records";
import { lookUpConsent } from "./consent-picks";
import { readOwnConsent } from "./consent-reads";
import { readDormReferrals } from "./dorm-referrals";
import { readScheduleBoard } from "./schedule-board";
import { readSessionHistory } from "./session-history";
import { addTestActor } from "./test-consents";
import { addTestAssignment, addTestSchedule } from "./test-schedules";
import { setTestConsent } from "./test-screenings";

const inTestDatabase = withTestDatabase();

// With no academic period running, only Pembibitan students live in the dorm.
const TODAY = "2026-10-16";

type Category = "monitor" | "refer" | null;

async function addMark(
  db: Database,
  by: string,
  studentId: string,
  category: Category,
  changedAt: string,
) {
  await db.insert(mentalHealthMarks).values({
    studentId,
    category,
    observation: category === null ? "" : `Pengamatan ${studentId}.`,
    changedBy: by,
    changedAt: new Date(changedAt),
  });
}

/**
 * Residents Ani, referred on 10 October and placed in room 7201 on
 * floor 2, and Budi, referred on 14 October; Citra, a resident marked
 * only "perlu pemantauan"; Eka, whose mark was cleared; Dodi, referred
 * but living in no dorm. Marked by BAM - Kesehatan Sari.
 */
async function addReferrals(db: Database) {
  const programId = await addTestProgram(db, "Prodi Uji Rujukan Asrama");
  const add = (nim: string, name: string, more = {}) =>
    addTestStudent(db, programId, { nim, name, isSeedling: true, ...more });
  const ani = await add("9988720001", "Ani Rujukan");
  const budi = await add("9988720002", "Budi Rujukan", { sex: "male" });
  const citra = await add("9988720003", "Citra Rujukan");
  const eka = await add("9988720004", "Eka Rujukan");
  const dodi = await add("9988720005", "Dodi Rujukan", { isSeedling: false });
  const room = await addTestRoom(db, {
    number: "7201",
    floor: 2,
    dorm: "wismantara_putri",
  });
  await placeTestResident(db, room, ani);
  const sari = await addTestActor(db, "BAM Kesehatan Sari", ["bam_health"]);
  await addMark(db, sari.id, ani, "refer", "2026-10-10T03:00:00Z");
  await addMark(db, sari.id, budi, "refer", "2026-10-14T03:00:00Z");
  await addMark(db, sari.id, citra, "monitor", "2026-10-15T03:00:00Z");
  await addMark(db, sari.id, eka, null, "2026-10-15T03:00:00Z");
  await addMark(db, sari.id, dodi, "refer", "2026-10-15T03:00:00Z");
  const counsellor = await addTestActor(db, "Konselor Uji Rujukan", [
    "counsellor",
  ]);
  return { counsellor, sari, ids: { ani, budi, citra, eka, dodi } };
}

describe("Rujukan potensi kesehatan mental dari asrama", () => {
  it("shows Konselor each resident marked perlu dirujuk, the newest mark first, with the number", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, ids } = await addReferrals(db);

      const list = await readDormReferrals(db, counsellor, 1, TODAY);

      expect(list?.matching).toBe(2);
      expect(list?.page).toBe(1);
      expect(list?.rows).toEqual([
        {
          studentId: ids.budi,
          name: "Budi Rujukan",
          nim: "9988720002",
          program: "Prodi Uji Rujukan Asrama",
          dorm: "wismantara_putra",
          room: null,
          observation: `Pengamatan ${ids.budi}.`,
          markedAt: new Date("2026-10-14T03:00:00Z"),
          markedBy: "BAM Kesehatan Sari",
          consent: null,
          activeSchedule: null,
        },
        expect.objectContaining({
          studentId: ids.ani,
          dorm: "wismantara_putri",
          room: { dorm: "wismantara_putri", floor: 2, number: "7201" },
          markedAt: new Date("2026-10-10T03:00:00Z"),
        }),
      ]);
    });
  });

  it("leaves out a student marked only perlu pemantauan, a cleared mark, and one living in no dorm", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, ids } = await addReferrals(db);

      const list = await readDormReferrals(db, counsellor, 1, TODAY);
      const shown = list?.rows.map((row) => row.studentId);

      expect(shown).not.toContain(ids.citra);
      expect(shown).not.toContain(ids.eka);
      expect(shown).not.toContain(ids.dodi);
    });
  });

  it("drops a row on the next read once a writer changes the mark to perlu pemantauan or Tidak ada indikasi", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, ids } = await addReferrals(db);
      await db
        .update(mentalHealthMarks)
        .set({ category: "monitor" })
        .where(eq(mentalHealthMarks.studentId, ids.budi));
      await db
        .update(mentalHealthMarks)
        .set({ category: null, observation: "" })
        .where(eq(mentalHealthMarks.studentId, ids.ani));

      const list = await readDormReferrals(db, counsellor, 1, TODAY);

      expect(list).toEqual({ rows: [], matching: 0, page: 1 });
    });
  });

  it("is empty when nobody is referred", async () => {
    await inTestDatabase(async (db) => {
      const counsellor = await addTestActor(db, "Konselor Uji Kosong", [
        "counsellor",
      ]);
      const list = await readDormReferrals(db, counsellor, 1, TODAY);
      expect(list).toEqual({ rows: [], matching: 0, page: 1 });
    });
  });

  it("loads 20 rows a page, and the last page for a page past the end", async () => {
    await inTestDatabase(async (db) => {
      const programId = await addTestProgram(db, "Prodi Uji Rujukan Banyak");
      const sari = await addTestActor(db, "BAM Uji Banyak", ["bam_health"]);
      for (let place = 10; place < 31; place += 1) {
        const studentId = await addTestStudent(db, programId, {
          nim: `99887200${place}`,
          name: `Penghuni Rujukan ${place}`,
          isSeedling: true,
        });
        const day = String(place - 9).padStart(2, "0");
        await addMark(
          db,
          sari.id,
          studentId,
          "refer",
          `2026-09-${day}T03:00:00Z`,
        );
      }
      const counsellor = await addTestActor(db, "Konselor Uji Banyak", [
        "counsellor",
      ]);

      const first = await readDormReferrals(db, counsellor, 1, TODAY);
      const past = await readDormReferrals(db, counsellor, 9, TODAY);

      expect(first?.matching).toBe(21);
      expect(first?.rows).toHaveLength(20);
      expect(first?.rows[0]?.name).toBe("Penghuni Rujukan 30");
      expect(past?.page).toBe(2);
      expect(past?.rows.map((row) => row.name)).toEqual([
        "Penghuni Rujukan 10",
      ]);
    });
  });

  it("never lists a Konselor's own student", async () => {
    await inTestDatabase(async (db) => {
      const { ids } = await addReferrals(db);
      const own = await addTestActor(
        db,
        "Konselor Mahasiswa",
        ["counsellor"],
        ids.ani,
      );
      const list = await readDormReferrals(db, own, 1, TODAY);
      expect(list?.rows.map((row) => row.studentId)).toEqual([ids.budi]);
    });
  });
});

describe("what is already under way for a referral", () => {
  it("shows the consent and the active request of each row, and no request that is over", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, ids } = await addReferrals(db);
      const ani = await addTestActor(db, "Ani Sendiri", ["student"], ids.ani);
      const budi = await addTestActor(
        db,
        "Budi Sendiri",
        ["student"],
        ids.budi,
      );
      await setTestConsent(db, ids.ani, counsellor.id, "approved");
      await addTestSchedule(db, {
        studentId: ids.ani,
        studentAccountId: ani.id,
        status: "scheduled",
        counsellorId: counsellor.id,
      });
      await setTestConsent(db, ids.budi, counsellor.id, "waiting");
      await addTestSchedule(db, {
        studentId: ids.budi,
        studentAccountId: budi.id,
        status: "done",
        counsellorId: counsellor.id,
      });

      const list = await readDormReferrals(db, counsellor, 1, TODAY);

      expect(list?.rows).toEqual([
        expect.objectContaining({
          studentId: ids.budi,
          consent: "waiting",
          activeSchedule: null,
        }),
        expect.objectContaining({
          studentId: ids.ani,
          consent: "approved",
          activeSchedule: "scheduled",
        }),
      ]);
    });
  });

  it("shows the student's own request, never an assignment beside it or alone", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, ids } = await addReferrals(db);
      const ani = await addTestActor(db, "Ani Sendiri", ["student"], ids.ani);
      const sender = await addTestActor(db, "Pembina Uji", [
        "discipline_officer",
      ]);
      await addTestAssignment(db, { studentId: ids.ani, senderId: sender.id });
      await addTestSchedule(db, {
        studentId: ids.ani,
        studentAccountId: ani.id,
        status: "submitted",
      });
      await addTestAssignment(db, {
        studentId: ids.budi,
        senderId: sender.id,
        kind: "called",
      });

      const list = await readDormReferrals(db, counsellor, 1, TODAY);

      expect(list?.rows).toEqual([
        expect.objectContaining({ studentId: ids.budi, activeSchedule: null }),
        expect.objectContaining({
          studentId: ids.ani,
          activeSchedule: "submitted",
        }),
      ]);
    });
  });

  it("still opens the consent of a student whose mark was removed while Tindak lanjuti was pressed, and drops the row on the next read", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, ids } = await addReferrals(db);
      const before = await readDormReferrals(db, counsellor, 1, TODAY);
      expect(before?.rows.map((row) => row.studentId)).toContain(ids.ani);

      await db
        .update(mentalHealthMarks)
        .set({ category: null, observation: "" })
        .where(eq(mentalHealthMarks.studentId, ids.ani));

      expect(await lookUpConsent(db, counsellor, ids.ani)).toEqual({
        ok: true,
        value: null,
      });
      const after = await readDormReferrals(db, counsellor, 1, TODAY);
      expect(after?.rows.map((row) => row.studentId)).toEqual([ids.budi]);
    });
  });
});

const REFUSED: RoleId[] = [
  "bam_health",
  "dorm_manager",
  "mentor",
  "head_of_unit",
  "student",
];

describe("a hand-made request about a referral by anyone but Konselor", () => {
  it.each(REFUSED)("gives %s nothing of the list", async (role) => {
    await inTestDatabase(async (db) => {
      await addReferrals(db);
      const actor = await addTestActor(db, "Uji Ditolak", [role]);
      expect(await readDormReferrals(db, actor, 1, TODAY)).toBeNull();
    });
  });

  it.each(REFUSED)(
    "gives %s nothing of a referred student's consent, schedules or sessions",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { ids } = await addReferrals(db);
        const actor = await addTestActor(db, "Uji Ditolak", [role]);

        const consent = await lookUpConsent(db, actor, ids.budi);
        const board = await readScheduleBoard(db, actor, {
          filter: "all",
          page: 1,
        });
        const sessions = await readSessionHistory(db, actor, ids.budi, 1);

        expect(consent.ok).toBe(false);
        expect(board).toBeNull();
        expect(sessions.ok).toBe(false);
      });
    },
  );

  it("tells the referred student nothing: they see no consent until Konselor asks", async () => {
    await inTestDatabase(async (db) => {
      const { ids } = await addReferrals(db);
      const own = await addTestActor(db, "Budi Sendiri", ["student"], ids.budi);
      expect(await readOwnConsent(db, own)).toBeNull();
      expect(await readDormReferrals(db, own, 1, TODAY)).toBeNull();
    });
  });
});
