import { describe, expect, it } from "vitest";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import { mainIndicators as savedIndicators } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { NOT_ALLOWED } from "./not-allowed";
import { saveMainIndicators } from "./save-main-indicators";
import { readMainIndicators } from "./stored-main-indicators";
import { addTestActor } from "./test-records";

const inTestDatabase = withTestDatabase();

const MAY_CHANGE: RoleId[] = ["head_of_unit", "upk_staff"];

function sent(texts: Record<string, string>) {
  return (code: string) => texts[code] ?? `Teks ${code}`;
}

describe("saveMainIndicators", () => {
  it.each(MAY_CHANGE)(
    "lets %s save the 24 texts, kept with who changed them and when",
    async (role) => {
      await inTestDatabase(async (db) => {
        const actor = await addTestActor(db, "Pegawai Uji", [role]);

        const saved = await saveMainIndicators(db, actor, sent({}));

        expect(saved).toEqual({ ok: true, value: null });
        const shown = await readMainIndicators(db);
        const texts = shown.values.flatMap((value) =>
          value.indicators.map(({ code, text }) => [code, text]),
        );
        expect(texts).toHaveLength(24);
        for (const [code, text] of texts) expect(text).toBe(`Teks ${code}`);
        expect(shown.changed?.by).toBe("Pegawai Uji");
        expect(shown.changed?.at).toBeInstanceOf(Date);
      });
    },
  );

  it.each(ROLE_IDS.filter((role) => !MAY_CHANGE.includes(role)))(
    "refuses %s and saves nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const actor = await addTestActor(db, "Pegawai Uji", [role]);

        const saved = await saveMainIndicators(db, actor, sent({}));

        expect(saved).toEqual(NOT_ALLOWED);
        expect(await db.select().from(savedIndicators)).toEqual([]);
      });
    },
  );

  it("saves nothing when one text is empty", async () => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);

      const saved = await saveMainIndicators(db, actor, sent({ A2: " " }));

      expect(saved).toEqual({
        ok: false,
        error: "Isi keempat level indikator Adaptif.",
      });
      expect(await db.select().from(savedIndicators)).toEqual([]);
    });
  });

  it("saves nothing when one text is over 300 characters", async () => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);

      const saved = await saveMainIndicators(
        db,
        actor,
        sent({ L4: "a".repeat(301) }),
      );

      expect(saved).toEqual({
        ok: false,
        error: "Teks indikator paling banyak 300 karakter.",
      });
      expect(await db.select().from(savedIndicators)).toEqual([]);
    });
  });

  it("replaces the texts saved before, with the one who changed them last", async () => {
    await inTestDatabase(async (db) => {
      const first = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const second = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);
      await saveMainIndicators(db, first, sent({}));

      await saveMainIndicators(db, second, sent({ M1: "Teks baru" }));

      const shown = await readMainIndicators(db);
      expect(shown.values[0]?.indicators[0]?.text).toBe("Teks baru");
      expect(shown.values[0]?.indicators[1]?.text).toBe("Teks M2");
      expect(shown.changed?.by).toBe("Kepala Uji");
      expect(await db.select().from(savedIndicators)).toHaveLength(24);
    });
  });
});
