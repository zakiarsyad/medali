import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import { fitnessCategoryLimits } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { STARTING_LIMITS, STARTING_VERSION } from "@/health-notes/fitness-ids";
import { readFitnessLimits } from "@/health-notes/fitness-limits";
import { LIMITS_NOT_DOWN, LIMITS_NOT_WHOLE } from "./fitness-input";
import {
  LIMITS_CHANGED_SINCE,
  NOT_ALLOWED_TO_SET_LIMITS,
  saveFitnessLimits,
} from "./save-fitness-limits";
import { addTestActor } from "./test-fitness";

const inTestDatabase = withTestDatabase();

const SAVED = { ok: true, value: null };

const BAIK_75 = { excellentFrom: "85", goodFrom: "75", attentionFrom: "55" };

describe("saveFitnessLimits", () => {
  it("sets Baik from 75 with who and when, and logs the limits before and after", async () => {
    await inTestDatabase(async (db) => {
      const kepala = await addTestActor(db, "Kepala Uji Ambang", [
        "head_of_unit",
      ]);

      expect(
        await saveFitnessLimits(db, kepala, BAIK_75, STARTING_VERSION),
      ).toEqual(SAVED);

      const inForce = await readFitnessLimits(db);
      expect(inForce.limits).toEqual({ ...STARTING_LIMITS, goodFrom: 75 });
      expect(inForce.set).toEqual({
        at: expect.any(Date),
        by: "Kepala Uji Ambang",
      });
      const lines = await db.select().from(fitnessCategoryLimits);
      expect(lines).toEqual([
        expect.objectContaining({
          excellentFrom: 85,
          goodFrom: 75,
          attentionFrom: 55,
          before: STARTING_LIMITS,
          replaces: null,
          setBy: kepala.id,
        }),
      ]);
    });
  });

  it("logs the limits set before as the before of the next setting", async () => {
    await inTestDatabase(async (db) => {
      const kepala = await addTestActor(db, "Kepala Uji Ambang", [
        "head_of_unit",
      ]);
      await saveFitnessLimits(db, kepala, BAIK_75, STARTING_VERSION);
      const first = await readFitnessLimits(db);
      const next = { excellentFrom: "90", goodFrom: "75", attentionFrom: "60" };

      expect(await saveFitnessLimits(db, kepala, next, first.version)).toEqual(
        SAVED,
      );

      const lines = await db.select().from(fitnessCategoryLimits);
      const latest = lines.find((line) => line.replaces === first.version);
      expect(latest).toMatchObject({
        excellentFrom: 90,
        before: { ...STARTING_LIMITS, goodFrom: 75 },
      });
    });
  });

  it.each<[string, typeof BAIK_75, string]>([
    [
      "limits that do not go down",
      { excellentFrom: "70", goodFrom: "85", attentionFrom: "55" },
      LIMITS_NOT_DOWN,
    ],
    [
      "a limit of 0",
      { excellentFrom: "85", goodFrom: "70", attentionFrom: "0" },
      LIMITS_NOT_WHOLE,
    ],
    [
      "a limit that is not whole",
      { excellentFrom: "85", goodFrom: "70.5", attentionFrom: "55" },
      LIMITS_NOT_WHOLE,
    ],
  ])("saves nothing for %s, and says why", async (_, sent, error) => {
    await inTestDatabase(async (db) => {
      const kepala = await addTestActor(db, "Kepala Uji Ambang", [
        "head_of_unit",
      ]);

      expect(
        await saveFitnessLimits(db, kepala, sent, STARTING_VERSION),
      ).toEqual({ ok: false, error });
      expect(await db.select().from(fitnessCategoryLimits)).toEqual([]);
    });
  });

  it.each<RoleId>(["assessor", "director", "head_of_program", "mentor"])(
    "refuses %s, Penilai Mahasiswa sending new limits by hand among them, and saves nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const actor = await addTestActor(db, "Bukan Kepala Uji", [role]);

        expect(
          await saveFitnessLimits(db, actor, BAIK_75, STARTING_VERSION),
        ).toEqual(NOT_ALLOWED_TO_SET_LIMITS);
        expect(await db.select().from(fitnessCategoryLimits)).toEqual([]);
      });
    },
  );

  it("refuses a form opened before someone else saved, and says who", async () => {
    await inTestDatabase(async (db) => {
      const ani = await addTestActor(db, "Kepala Ani", ["head_of_unit"]);
      const budi = await addTestActor(db, "Kepala Budi", ["head_of_unit"]);
      await saveFitnessLimits(db, ani, BAIK_75, STARTING_VERSION);

      expect(
        await saveFitnessLimits(
          db,
          budi,
          { excellentFrom: "90", goodFrom: "80", attentionFrom: "60" },
          STARTING_VERSION,
        ),
      ).toEqual({
        ok: false,
        error: "Ambang sudah diubah oleh Kepala Ani. Muat ulang.",
      });
      expect(await db.select().from(fitnessCategoryLimits)).toHaveLength(1);
    });
  });

  it("refuses a version that is no setting of the limits", async () => {
    await inTestDatabase(async (db) => {
      const kepala = await addTestActor(db, "Kepala Uji Ambang", [
        "head_of_unit",
      ]);

      expect(
        await saveFitnessLimits(
          db,
          kepala,
          BAIK_75,
          "00000000-0000-4000-8000-000000000999",
        ),
      ).toEqual(LIMITS_CHANGED_SINCE);
    });
  });
});
