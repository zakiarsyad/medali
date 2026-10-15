// Sample Tahun akademik of this file: 3220 to 3220.
// Sample NIMs of this file: 9985020000 to 9985020099.
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import { skpmConversions } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { INVALID_POINTS } from "./conversion-input";
import { saveConversion } from "./save-conversion";
import { START_PARAMS } from "./skpm-address";
import { readSkpmList } from "./skpm-board";
import { readConversion } from "./skpm-conversion";
import { NOT_ALLOWED_TO_UPLOAD } from "./skpm-messages";
import { skpmVisibleTo } from "./skpm-readers";
import {
  addTestActor,
  addTestPeriod,
  addTestStudents,
  addTestUpload,
} from "./test-skpm";

const inTestDatabase = withTestDatabase();

const MOMENT = new Date("3220-10-12T03:00:00Z");

describe("saveConversion", () => {
  it("starts at 50 points for 100", async () => {
    await inTestDatabase(async (db) => {
      expect(await readConversion(db)).toEqual({
        pointsForHundred: 50,
        set: null,
      });
    });
  });

  it("sets the points for 100 with who and when, logs the number before, and changes every Nilai SKPM", async () => {
    await inTestDatabase(async (db) => {
      const periodId = await addTestPeriod(db, 3220);
      const { studentIds } = await addTestStudents(
        db,
        "Prodi Uji Konversi SKPM",
        3220,
        ["9985020001"],
      );
      const [ani] = studentIds;
      if (!ani) throw new Error("Student missing.");
      const penilai = await addTestActor(db, "Penilai Uji Konversi", [
        "assessor",
      ]);
      const kepala = await addTestActor(db, "Kepala Uji Konversi", [
        "head_of_unit",
      ]);
      await addTestUpload(db, penilai, {
        mode: "add",
        periodId,
        enteredAt: MOMENT,
        rows: [{ studentId: ani, points: 30 }],
      });

      expect(await saveConversion(db, penilai, "40")).toEqual({
        ok: true,
        value: 40,
      });
      expect(await saveConversion(db, kepala, " 60 ")).toEqual({
        ok: true,
        value: 60,
      });

      const now = await readConversion(db);
      expect(now).toEqual({
        pointsForHundred: 60,
        set: { at: expect.any(Date), by: "Kepala Uji Konversi" },
      });
      const log = await db
        .select()
        .from(skpmConversions)
        .orderBy(skpmConversions.setAt);
      expect(
        log.map((line) => [
          line.pointsBefore,
          line.pointsForHundred,
          line.setBy,
        ]),
      ).toEqual([
        [50, 40, penilai.id],
        [40, 60, kepala.id],
      ]);
      const list = await readSkpmList(
        db,
        skpmVisibleTo(kepala),
        now.pointsForHundred,
        { ...START_PARAMS, query: "9985020001" },
      );
      expect(list.rows[0]?.totals?.score).toBe(50);
    });
  });

  it.each(["", "0", "1001", "abc"])(
    "saves nothing for %j and says so",
    async (sent) => {
      await inTestDatabase(async (db) => {
        const penilai = await addTestActor(db, "Penilai Uji Salah", [
          "assessor",
        ]);

        expect(await saveConversion(db, penilai, sent)).toEqual(INVALID_POINTS);
        expect(await db.select().from(skpmConversions)).toEqual([]);
      });
    },
  );

  it.each<[string, RoleId]>([
    ["Pengasuh", "mentor"],
    ["Direktur", "director"],
    ["Ketua Program Studi", "head_of_program"],
    ["a student", "student"],
  ])("refuses %s, who may not set it, saving nothing", async (_, role) => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Tanpa Hak Konversi", [role]);

      expect(await saveConversion(db, actor, "40")).toEqual(
        NOT_ALLOWED_TO_UPLOAD,
      );
      expect(await db.select().from(skpmConversions)).toEqual([]);
    });
  });
});
