import { describe, expect, it } from "vitest";
import { stageBreakdowns } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { stageBreakdown } from "./stage-breakdown";
import { readStageBreakdowns } from "./stored-stage-breakdowns";
import { addTestActor } from "./test-records";

const inTestDatabase = withTestDatabase();

describe("readStageBreakdowns", () => {
  it("gives the starting content of the four tahap, changed by nobody, while none is saved", async () => {
    await inTestDatabase(async (db) => {
      expect(await readStageBreakdowns(db)).toEqual(
        [1, 2, 3, 4].map((tahapNo) => ({
          tahapNo,
          values: stageBreakdown(tahapNo, new Map()),
          changed: null,
        })),
      );
    });
  });

  it("gives saved content over the starting one, with the last change of its tahap only", async () => {
    await inTestDatabase(async (db) => {
      const earlier = await addTestActor(db, "Pegawai Uji Awal", ["upk_staff"]);
      const later = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);
      const first = {
        text: "Teks uji awal",
        activities: ["Kegiatan uji"],
        indicatorCodes: ["M1", "M2"],
      };
      const second = {
        text: "Teks uji akhir",
        activities: [],
        indicatorCodes: ["E3"],
      };
      await db.insert(stageBreakdowns).values([
        {
          tahap: 2,
          valueKey: "E",
          ...second,
          changedAt: new Date("2026-03-02T03:00:00Z"),
          changedBy: later.id,
        },
        {
          tahap: 2,
          valueKey: "M",
          ...first,
          changedAt: new Date("2026-03-01T03:00:00Z"),
          changedBy: earlier.id,
        },
      ]);

      const shown = await readStageBreakdowns(db);

      expect(shown[1]).toEqual({
        tahapNo: 2,
        values: stageBreakdown(
          2,
          new Map([
            ["M", first],
            ["E", second],
          ]),
        ),
        changed: { at: new Date("2026-03-02T03:00:00Z"), by: "Kepala Uji" },
      });
      expect(shown[0]?.changed).toBeNull();
      expect(shown[0]?.values).toEqual(stageBreakdown(1, new Map()));
    });
  });
});
