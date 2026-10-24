import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import { mentoringIndicatorSets } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  type ScoreIndicator,
  STARTING_INDICATORS,
} from "@/mentoring/score-indicators";
import { readIndicators, STARTING_INDICATORS_VERSION } from "./indicator-set";
import {
  INDICATORS_CHANGED,
  NOT_ALLOWED_TO_SET_INDICATORS,
  saveIndicators,
} from "./save-indicators";
import { addTestAccount } from "./test-records";

const inTestDatabase = withTestDatabase();

const SAVED = { ok: true, value: null };

function withFirst(name: string): ScoreIndicator[] {
  return STARTING_INDICATORS.map((indicator, place) =>
    place === 0 ? { name, sentence: "Kalimat uji pertama." } : indicator,
  );
}

describe("saveIndicators", () => {
  it("sets the six indicators with who and when, and logs the ones before", async () => {
    await inTestDatabase(async (db) => {
      const kepala = await addTestAccount(db, "Kepala Uji Indikator", [
        "head_of_unit",
      ]);

      expect(
        await saveIndicators(
          db,
          kepala,
          withFirst(" Kemandirian "),
          STARTING_INDICATORS_VERSION,
        ),
      ).toEqual(SAVED);

      const inForce = await readIndicators(db);
      expect(inForce.indicators).toEqual(withFirst("Kemandirian"));
      expect(inForce.set).toEqual({
        at: expect.any(Date),
        by: "Kepala Uji Indikator",
      });
      const lines = await db.select().from(mentoringIndicatorSets);
      expect(lines).toHaveLength(1);
      expect(lines[0]).toMatchObject({
        before: STARTING_INDICATORS,
        replaces: null,
        setBy: kepala.id,
      });
    });
  });

  it("logs the indicators set before as the before of the next setting", async () => {
    await inTestDatabase(async (db) => {
      const kepala = await addTestAccount(db, "Kepala Uji Indikator", [
        "head_of_unit",
      ]);
      await saveIndicators(
        db,
        kepala,
        withFirst("Kemandirian"),
        STARTING_INDICATORS_VERSION,
      );
      const first = await readIndicators(db);

      await saveIndicators(
        db,
        kepala,
        withFirst("Mandiri Diri"),
        first.version,
      );

      const now = await readIndicators(db);
      expect(now.indicators[0]?.name).toBe("Mandiri Diri");
      const lines = await db.select().from(mentoringIndicatorSets);
      const second = lines.find((line) => line.replaces === first.version);
      expect(second?.before).toEqual(withFirst("Kemandirian"));
    });
  });

  it.each<RoleId>(["mentor", "director", "head_of_program", "student"])(
    "refuses %s, saving nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const other = await addTestAccount(db, "Akun Uji Indikator", [role]);

        expect(
          await saveIndicators(
            db,
            other,
            withFirst("Kemandirian"),
            STARTING_INDICATORS_VERSION,
          ),
        ).toEqual(NOT_ALLOWED_TO_SET_INDICATORS);
        expect(await db.select().from(mentoringIndicatorSets)).toEqual([]);
      });
    },
  );

  it.each<[string, ScoreIndicator[]]>([
    ["an empty name", withFirst(" ")],
    ["two equal names", withFirst("Empati")],
    [
      "a sentence over 200 characters",
      STARTING_INDICATORS.map((indicator) => ({
        ...indicator,
        sentence: "a".repeat(201),
      })),
    ],
  ])("saves nothing with %s", async (_, sent) => {
    await inTestDatabase(async (db) => {
      const kepala = await addTestAccount(db, "Kepala Uji Indikator", [
        "head_of_unit",
      ]);

      const saved = await saveIndicators(
        db,
        kepala,
        sent,
        STARTING_INDICATORS_VERSION,
      );

      expect(saved.ok).toBe(false);
      expect(await db.select().from(mentoringIndicatorSets)).toEqual([]);
    });
  });

  it("tells a form opened before another save who changed the indicators, saving nothing", async () => {
    await inTestDatabase(async (db) => {
      const ani = await addTestAccount(db, "Kepala Ani", ["head_of_unit"]);
      const budi = await addTestAccount(db, "Kepala Budi", ["head_of_unit"]);
      await saveIndicators(
        db,
        ani,
        withFirst("Kemandirian"),
        STARTING_INDICATORS_VERSION,
      );

      expect(
        await saveIndicators(
          db,
          budi,
          withFirst("Mandiri Diri"),
          STARTING_INDICATORS_VERSION,
        ),
      ).toEqual({
        ok: false,
        error: "Indikator sudah diubah oleh Kepala Ani. Muat ulang.",
      });
      expect(await db.select().from(mentoringIndicatorSets)).toHaveLength(1);
    });
  });

  it("refuses a version that is no setting", async () => {
    await inTestDatabase(async (db) => {
      const kepala = await addTestAccount(db, "Kepala Uji Indikator", [
        "head_of_unit",
      ]);

      expect(
        await saveIndicators(
          db,
          kepala,
          withFirst("Kemandirian"),
          "6f1c1d2e-0000-4000-8000-000000000000",
        ),
      ).toEqual(INDICATORS_CHANGED);
    });
  });

  it("saves the same form sent twice once", async () => {
    await inTestDatabase(async (db) => {
      const kepala = await addTestAccount(db, "Kepala Uji Indikator", [
        "head_of_unit",
      ]);
      const sent = withFirst("Kemandirian");

      await saveIndicators(db, kepala, sent, STARTING_INDICATORS_VERSION);
      expect(
        await saveIndicators(db, kepala, sent, STARTING_INDICATORS_VERSION),
      ).toEqual(SAVED);

      expect(await db.select().from(mentoringIndicatorSets)).toHaveLength(1);
    });
  });
});
