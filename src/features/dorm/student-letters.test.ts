// Sample Tahun akademik of this file: 3297 to 3297.
// Sample NIMs of this file: 9986108000 to 9986108099.
import { describe, expect, it } from "vitest";
import { withTestDatabase } from "@/db/test-database";
import { readStudentLetters } from "./student-letters";
import { addViolationActor, addViolationSetting } from "./test-violations";
import { addTestLetter, issuedBy, periodIdOf } from "./test-warnings";

const inTestDatabase = withTestDatabase();

const NOTE = "Pelanggaran berulang setelah SP 1.";

describe("readStudentLetters", () => {
  it("gives the SPs issued in the semester with Hasil klarifikasi and the proposal note only when asked for them", async () => {
    await inTestDatabase(async (db) => {
      const setting = await addViolationSetting(
        db,
        3297,
        "Prodi Uji Hasil SP",
        ["9986108001", "9986108002", "9986108003", "9986108004", "9986108005"],
      );
      const [ani = ""] = setting.residents;
      const manager = await addViolationActor(db, "Pengelola Uji Hasil", [
        "dorm_manager",
      ]);
      const periodId = await periodIdOf(db, 3297);
      const at = new Date("3297-10-10T09:30:00Z");
      await addTestLetter(db, {
        studentId: ani,
        periodId,
        level: 1,
        ...issuedBy(manager.id, at),
      });
      await addTestLetter(db, {
        studentId: ani,
        periodId,
        level: 2,
        ...issuedBy(manager.id, at),
        proposalNote: NOTE,
      });

      expect(await readStudentLetters(db, periodId, ani, true)).toEqual([
        {
          level: 1,
          issuedAt: at,
          result: "Mahasiswa hadir dan mengakui pelanggarannya.",
          proposalNote: "",
        },
        {
          level: 2,
          issuedAt: at,
          result: "Mahasiswa hadir dan mengakui pelanggarannya.",
          proposalNote: NOTE,
        },
      ]);
      expect(await readStudentLetters(db, periodId, ani, false)).toEqual([
        { level: 1, issuedAt: at, result: null, proposalNote: null },
        { level: 2, issuedAt: at, result: null, proposalNote: null },
      ]);
    });
  });

  it("leaves out a call not issued yet", async () => {
    await inTestDatabase(async (db) => {
      const setting = await addViolationSetting(
        db,
        3297,
        "Prodi Uji Hasil SP",
        ["9986108011", "9986108012", "9986108013", "9986108014", "9986108015"],
      );
      const [ani = ""] = setting.residents;
      const periodId = await periodIdOf(db, 3297);
      await addTestLetter(db, {
        studentId: ani,
        periodId,
        level: 1,
        callDay: "3297-10-21",
        callTime: "16:00",
        callPlace: "Aula",
      });

      expect(await readStudentLetters(db, periodId, ani, true)).toEqual([]);
    });
  });
});
