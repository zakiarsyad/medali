import { describe, expect, it } from "vitest";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import { stageBreakdowns } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { NOT_ALLOWED } from "./not-allowed";
import { saveStageBreakdown } from "./save-stage-breakdown";
import { stageBreakdown } from "./stage-breakdown";
import { readStageBreakdowns } from "./stored-stage-breakdowns";
import { addTestActor, SENT_BREAKDOWN } from "./test-records";

const inTestDatabase = withTestDatabase();

const MAY_CHANGE: RoleId[] = ["head_of_unit", "upk_staff"];

describe("saveStageBreakdown", () => {
  it.each(MAY_CHANGE)(
    "lets %s save one box, kept with who changed it and when",
    async (role) => {
      await inTestDatabase(async (db) => {
        const actor = await addTestActor(db, "Pegawai Uji", [role]);

        const saved = await saveStageBreakdown(db, actor, SENT_BREAKDOWN);

        expect(saved).toEqual({ ok: true, value: "Mandiri" });
        const shown = await readStageBreakdowns(db);
        expect(shown[1]?.values[0]).toEqual({
          key: "M",
          name: "Mandiri",
          text: "Teks uji.",
          activities: ["Kegiatan uji"],
          indicatorCodes: ["M2", "M3"],
        });
        expect(shown[1]?.values.slice(1)).toEqual(
          stageBreakdown(2, new Map()).slice(1),
        );
        expect(shown[1]?.changed?.by).toBe("Pegawai Uji");
        expect(shown[1]?.changed?.at).toBeInstanceOf(Date);
        expect(shown[0]?.changed).toBeNull();
      });
    },
  );

  it.each(ROLE_IDS.filter((role) => !MAY_CHANGE.includes(role)))(
    "refuses %s and saves nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const actor = await addTestActor(db, "Pegawai Uji", [role]);

        const saved = await saveStageBreakdown(db, actor, SENT_BREAKDOWN);

        expect(saved).toEqual(NOT_ALLOWED);
        expect(await db.select().from(stageBreakdowns)).toEqual([]);
      });
    },
  );

  it("saves nothing when no indicator is ticked", async () => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);

      const saved = await saveStageBreakdown(db, actor, {
        ...SENT_BREAKDOWN,
        indicatorCodes: [],
      });

      expect(saved).toEqual({
        ok: false,
        error: "Pilih minimal satu indikator tahap.",
      });
      expect(await db.select().from(stageBreakdowns)).toEqual([]);
    });
  });

  it("replaces the box saved before, with the one who changed it last", async () => {
    await inTestDatabase(async (db) => {
      const first = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const second = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);
      await saveStageBreakdown(db, first, SENT_BREAKDOWN);

      await saveStageBreakdown(db, second, {
        ...SENT_BREAKDOWN,
        text: "Teks baru.",
        activities: [],
        indicatorCodes: ["M1"],
      });

      const shown = await readStageBreakdowns(db);
      expect(shown[1]?.values[0]).toMatchObject({
        text: "Teks baru.",
        activities: [],
        indicatorCodes: ["M1"],
      });
      expect(shown[1]?.changed?.by).toBe("Kepala Uji");
      expect(await db.select().from(stageBreakdowns)).toHaveLength(1);
    });
  });

  it("keeps the same nilai of another tahap apart", async () => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);
      await saveStageBreakdown(db, actor, SENT_BREAKDOWN);

      await saveStageBreakdown(db, actor, { ...SENT_BREAKDOWN, tahap: "3" });

      expect(await db.select().from(stageBreakdowns)).toHaveLength(2);
    });
  });
});
