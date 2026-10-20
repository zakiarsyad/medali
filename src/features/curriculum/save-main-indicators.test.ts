import { describe, expect, it } from "vitest";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { mainIndicators as savedIndicators } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { NOT_ALLOWED } from "./not-allowed";
import {
  MAIN_INDICATORS_CHANGED_BY_OTHER,
  saveMainIndicators,
} from "./save-main-indicators";
import {
  readMainIndicators,
  STARTING_INDICATORS_VERSION,
} from "./stored-main-indicators";
import { addTestActor } from "./test-records";

const inTestDatabase = withTestDatabase();

const MAY_CHANGE: RoleId[] = ["head_of_unit", "upk_staff"];

function sent(texts: Record<string, string>) {
  return (code: string) => texts[code] ?? `Teks ${code}`;
}

/** The version a form opened now is given. */
async function openedVersion(db: Database): Promise<string> {
  return (await readMainIndicators(db)).version;
}

async function keptText(db: Database, code: string): Promise<string> {
  const shown = await readMainIndicators(db);
  const indicators = shown.values.flatMap((value) => value.indicators);
  const found = indicators.find((indicator) => indicator.code === code);
  if (!found) throw new Error(`No indicator ${code}.`);
  return found.text;
}

describe("saveMainIndicators", () => {
  it.each(MAY_CHANGE)(
    "lets %s save the 24 texts, kept with who changed them and when",
    async (role) => {
      await inTestDatabase(async (db) => {
        const actor = await addTestActor(db, "Pegawai Uji", [role]);

        const saved = await saveMainIndicators(
          db,
          actor,
          STARTING_INDICATORS_VERSION,
          sent({}),
        );

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

        const saved = await saveMainIndicators(
          db,
          actor,
          STARTING_INDICATORS_VERSION,
          sent({}),
        );

        expect(saved).toEqual(NOT_ALLOWED);
        expect(await db.select().from(savedIndicators)).toEqual([]);
      });
    },
  );

  it("saves nothing when one text is empty", async () => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);

      const saved = await saveMainIndicators(
        db,
        actor,
        STARTING_INDICATORS_VERSION,
        sent({ A2: " " }),
      );

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
        STARTING_INDICATORS_VERSION,
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
      await saveMainIndicators(
        db,
        first,
        STARTING_INDICATORS_VERSION,
        sent({}),
      );

      const saved = await saveMainIndicators(
        db,
        second,
        await openedVersion(db),
        sent({ M1: "Teks baru" }),
      );

      expect(saved).toEqual({ ok: true, value: null });
      const shown = await readMainIndicators(db);
      expect(shown.values[0]?.indicators[0]?.text).toBe("Teks baru");
      expect(shown.values[0]?.indicators[1]?.text).toBe("Teks M2");
      expect(shown.changed?.by).toBe("Kepala Uji");
      expect(await db.select().from(savedIndicators)).toHaveLength(24);
    });
  });

  it("refuses a save from a form opened before another save, and keeps the other save whole", async () => {
    await inTestDatabase(async (db) => {
      const staff = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const head = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);
      await saveMainIndicators(
        db,
        staff,
        STARTING_INDICATORS_VERSION,
        sent({}),
      );
      const opened = await openedVersion(db);
      await saveMainIndicators(db, staff, opened, sent({ E1: "Teks E1 baru" }));
      const before = await db.select().from(savedIndicators);

      const saved = await saveMainIndicators(
        db,
        head,
        opened,
        sent({ E2: "Teks E2 baru" }),
      );

      expect(saved).toEqual(MAIN_INDICATORS_CHANGED_BY_OTHER);
      expect(await db.select().from(savedIndicators)).toEqual(before);
      expect(await keptText(db, "E1")).toBe("Teks E1 baru");
      expect(await keptText(db, "E2")).toBe("Teks E2");
    });
  });

  it("keeps the first of two forms opened on the starting texts and refuses the second", async () => {
    await inTestDatabase(async (db) => {
      const staff = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const head = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);
      const opened = await openedVersion(db);
      expect(opened).toBe(STARTING_INDICATORS_VERSION);

      const first = await saveMainIndicators(
        db,
        staff,
        opened,
        sent({ E1: "Teks E1 baru" }),
      );
      const second = await saveMainIndicators(
        db,
        head,
        opened,
        sent({ E2: "Teks E2 baru" }),
      );

      expect(first).toEqual({ ok: true, value: null });
      expect(second).toEqual(MAIN_INDICATORS_CHANGED_BY_OTHER);
      expect(await keptText(db, "E1")).toBe("Teks E1 baru");
      expect(await keptText(db, "E2")).toBe("Teks E2");
      expect((await readMainIndicators(db)).changed?.by).toBe("Pegawai Uji");
    });
  });

  it("saves twice in a row for one person who loads the page again between the saves", async () => {
    await inTestDatabase(async (db) => {
      const head = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);

      const first = await saveMainIndicators(
        db,
        head,
        await openedVersion(db),
        sent({ L1: "Teks L1 pertama" }),
      );
      const versionAfterFirst = await openedVersion(db);
      const second = await saveMainIndicators(
        db,
        head,
        versionAfterFirst,
        sent({ L1: "Teks L1 kedua" }),
      );

      expect(first).toEqual({ ok: true, value: null });
      expect(second).toEqual({ ok: true, value: null });
      expect(await keptText(db, "L1")).toBe("Teks L1 kedua");
      expect(await openedVersion(db)).not.toBe(versionAfterFirst);
    });
  });

  it.each(["", "bukan versi", "2026-03-01"])(
    "refuses a sent version %j that this app never gave, and saves nothing",
    async (version) => {
      await inTestDatabase(async (db) => {
        const head = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);

        const saved = await saveMainIndicators(db, head, version, sent({}));

        expect(saved).toEqual(MAIN_INDICATORS_CHANGED_BY_OTHER);
        expect(await db.select().from(savedIndicators)).toEqual([]);
      });
    },
  );

  it("refuses the starting version once the texts were saved", async () => {
    await inTestDatabase(async (db) => {
      const head = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);
      await saveMainIndicators(db, head, STARTING_INDICATORS_VERSION, sent({}));

      const saved = await saveMainIndicators(
        db,
        head,
        STARTING_INDICATORS_VERSION,
        sent({ M1: "Teks baru" }),
      );

      expect(saved).toEqual(MAIN_INDICATORS_CHANGED_BY_OTHER);
      expect(await keptText(db, "M1")).toBe("Teks M1");
    });
  });
});
