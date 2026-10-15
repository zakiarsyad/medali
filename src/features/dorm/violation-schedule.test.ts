// Sample Tahun akademik of this file: 3155 to 3155.
// Sample NIMs of this file: 9982060000 to 9982060099.
import { describe, expect, it } from "vitest";
import { withTestDatabase } from "@/db/test-database";
import { cancelViolation } from "./cancel-violation";
import { saveViolations } from "./save-violations";
import { EVERYONE } from "./test-records";
import {
  addViolationActor,
  addViolationSetting,
  sentList,
  sentRow,
  violationsUnder,
} from "./test-violations";
import { readViolationSchedule } from "./violation-schedule";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 12 October 3155.
const MOMENT = new Date("3155-10-12T03:00:00Z");
const TODAY = "3155-10-12";

describe("readViolationSchedule", () => {
  it("lists the violations still to be announced, the soonest first, without the cancelled and the announced ones", async () => {
    await inTestDatabase(async (db) => {
      const setting = await addViolationSetting(
        db,
        3155,
        "Prodi Uji Jadwal Pelanggaran",
        ["9982060001", "9982060002", "9982060003", "9982060004", "9982060005"],
      );
      const [ani = "", bea = "", cici = ""] = setting.residents;
      const actor = await addViolationActor(db, "BAM Uji Jadwal", ["bam_bphk"]);
      const save = (rows: ReturnType<typeof sentRow>[], time: string) =>
        saveViolations(
          db,
          actor,
          crypto.randomUUID(),
          sentList(TODAY, rows, { announceTime: time }),
          MOMENT,
        );
      await save([sentRow(bea)], "21:00");
      await save([sentRow(ani)], "18:00");
      await save([sentRow(setting.otherDorm)], "09:00");
      const cancelledKey = crypto.randomUUID();
      await saveViolations(
        db,
        actor,
        cancelledKey,
        sentList(TODAY, [sentRow(cici)]),
        MOMENT,
      );
      const [cancelled] = await violationsUnder(db, cancelledKey);
      await cancelViolation(db, actor, cancelled?.id ?? "", MOMENT);

      const schedule = await readViolationSchedule(db, EVERYONE, MOMENT, 1);

      expect(schedule.matching).toBe(2);
      expect(
        schedule.rows.map((row) => [row.name, row.announcedAt.toISOString()]),
      ).toEqual([
        ["Ani Uji Pelanggaran", "3155-10-12T11:00:00.000Z"],
        ["Bea Uji Pelanggaran", "3155-10-12T14:00:00.000Z"],
      ]);
      expect(schedule.rows[0]).toMatchObject({
        day: TODAY,
        dorm: "dana_rakca",
        enteredBy: "BAM Uji Jadwal",
      });
    });
  });
});
