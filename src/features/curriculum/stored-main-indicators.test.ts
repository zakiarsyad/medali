import { describe, expect, it } from "vitest";
import { mainIndicators as savedIndicators } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { mainIndicators } from "./main-indicators";
import { STARTING_VERSION } from "./saved-version";
import { readMainIndicators } from "./stored-main-indicators";
import { addTestActor } from "./test-records";

const inTestDatabase = withTestDatabase();

describe("readMainIndicators", () => {
  it("gives the starting texts, changed by nobody, while none is saved", async () => {
    await inTestDatabase(async (db) => {
      expect(await readMainIndicators(db)).toEqual({
        values: mainIndicators(new Map()),
        changed: null,
        version: STARTING_VERSION,
      });
    });
  });

  it("gives a saved text with who changed it last and when", async () => {
    await inTestDatabase(async (db) => {
      const earlier = await addTestActor(db, "Pegawai Uji Awal", ["upk_staff"]);
      const later = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);
      await db.insert(savedIndicators).values([
        {
          code: "E3",
          text: "Teks uji akhir",
          changedAt: new Date("2026-03-02T03:00:00Z"),
          changedBy: later.id,
        },
        {
          code: "M1",
          text: "Teks uji awal",
          changedAt: new Date("2026-03-01T03:00:00Z"),
          changedBy: earlier.id,
        },
      ]);

      const shown = await readMainIndicators(db);

      expect(shown.changed).toEqual({
        at: new Date("2026-03-02T03:00:00Z"),
        by: "Kepala Uji",
      });
      expect(shown.version).toBe("2026-03-02T03:00:00.000Z");
      expect(shown.values).toEqual(
        mainIndicators(
          new Map([
            ["E3", "Teks uji akhir"],
            ["M1", "Teks uji awal"],
          ]),
        ),
      );
    });
  });
});
