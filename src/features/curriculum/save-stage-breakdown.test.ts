import { describe, expect, it } from "vitest";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { stageBreakdowns } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import type { SentBreakdown } from "./breakdown-input";
import { NOT_ALLOWED } from "./not-allowed";
import {
  BREAKDOWN_CHANGED_BY_OTHER,
  saveStageBreakdown,
} from "./save-stage-breakdown";
import { STARTING_VERSION, savedVersion } from "./saved-version";
import { stageBreakdown } from "./stage-breakdown";
import { readStageBreakdowns } from "./stored-stage-breakdowns";
import { addTestActor, SENT_BREAKDOWN } from "./test-records";

const inTestDatabase = withTestDatabase();

const MAY_CHANGE: RoleId[] = ["head_of_unit", "upk_staff"];

/** The version of the box a form opened now for `sent` would send back. */
async function openedVersion(db: Database, sent: SentBreakdown) {
  const shown = await readStageBreakdowns(db);
  const tahap = shown.find(({ tahapNo }) => String(tahapNo) === sent.tahap);
  const value = tahap?.values.find(({ key }) => key === sent.valueKey);
  if (!value) throw new Error("The box is not shown.");
  return value.version;
}

async function keptText(db: Database): Promise<string[]> {
  const rows = await db
    .select({ text: stageBreakdowns.text })
    .from(stageBreakdowns);
  return rows.map(({ text }) => text).sort();
}

describe("saveStageBreakdown", () => {
  it.each(MAY_CHANGE)(
    "lets %s save one box, kept with who changed it and when",
    async (role) => {
      await inTestDatabase(async (db) => {
        const actor = await addTestActor(db, "Pegawai Uji", [role]);

        const saved = await saveStageBreakdown(
          db,
          actor,
          STARTING_VERSION,
          SENT_BREAKDOWN,
        );

        expect(saved).toEqual({ ok: true, value: "Mandiri" });
        const shown = await readStageBreakdowns(db);
        const changedAt = shown[1]?.changed?.at ?? null;
        expect(changedAt).toBeInstanceOf(Date);
        expect(shown[1]?.values[0]).toEqual({
          key: "M",
          name: "Mandiri",
          text: "Teks uji.",
          activities: ["Kegiatan uji"],
          indicatorCodes: ["M2", "M3"],
          version: savedVersion(changedAt),
        });
        expect(shown[1]?.values.slice(1)).toEqual(
          stageBreakdown(2, new Map()).slice(1),
        );
        expect(shown[1]?.changed?.by).toBe("Pegawai Uji");
        expect(shown[0]?.changed).toBeNull();
      });
    },
  );

  it.each(ROLE_IDS.filter((role) => !MAY_CHANGE.includes(role)))(
    "refuses %s and saves nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const actor = await addTestActor(db, "Pegawai Uji", [role]);

        const saved = await saveStageBreakdown(
          db,
          actor,
          STARTING_VERSION,
          SENT_BREAKDOWN,
        );

        expect(saved).toEqual(NOT_ALLOWED);
        expect(await db.select().from(stageBreakdowns)).toEqual([]);
      });
    },
  );

  it("saves nothing when no indicator is ticked", async () => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);

      const saved = await saveStageBreakdown(db, actor, STARTING_VERSION, {
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
      await saveStageBreakdown(db, first, STARTING_VERSION, SENT_BREAKDOWN);

      const saved = await saveStageBreakdown(
        db,
        second,
        await openedVersion(db, SENT_BREAKDOWN),
        {
          ...SENT_BREAKDOWN,
          text: "Teks baru.",
          activities: [],
          indicatorCodes: ["M1"],
        },
      );

      expect(saved).toEqual({ ok: true, value: "Mandiri" });
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

  it("refuses a box saved by another person since the form was opened, and keeps that save whole", async () => {
    await inTestDatabase(async (db) => {
      const staff = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const head = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);
      await saveStageBreakdown(db, staff, STARTING_VERSION, SENT_BREAKDOWN);
      const opened = await openedVersion(db, SENT_BREAKDOWN);
      await saveStageBreakdown(db, staff, opened, {
        ...SENT_BREAKDOWN,
        text: "Teks pegawai.",
      });
      const before = await db.select().from(stageBreakdowns);

      const saved = await saveStageBreakdown(db, head, opened, {
        ...SENT_BREAKDOWN,
        text: "Teks kepala.",
        activities: ["Kegiatan kepala"],
        indicatorCodes: ["M4"],
      });

      expect(saved).toEqual(BREAKDOWN_CHANGED_BY_OTHER);
      expect(saved).toEqual({
        ok: false,
        error:
          "Penjabaran ini baru saja diubah orang lain, jadi perubahan Anda tidak disimpan. Muat ulang untuk melihat versi terbaru.",
      });
      expect(await db.select().from(stageBreakdowns)).toEqual(before);
    });
  });

  it("keeps the first of two forms opened on a box never saved and refuses the second", async () => {
    await inTestDatabase(async (db) => {
      const staff = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const head = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);
      const opened = await openedVersion(db, SENT_BREAKDOWN);
      expect(opened).toBe(STARTING_VERSION);

      const first = await saveStageBreakdown(db, staff, opened, {
        ...SENT_BREAKDOWN,
        text: "Teks pertama.",
      });
      const second = await saveStageBreakdown(db, head, opened, {
        ...SENT_BREAKDOWN,
        text: "Teks kedua.",
      });

      expect(first).toEqual({ ok: true, value: "Mandiri" });
      expect(second).toEqual(BREAKDOWN_CHANGED_BY_OTHER);
      expect(await keptText(db)).toEqual(["Teks pertama."]);
      expect((await readStageBreakdowns(db))[1]?.changed?.by).toBe(
        "Pegawai Uji",
      );
    });
  });

  it("saves each of three forms opened on the starting text of different boxes", async () => {
    await inTestDatabase(async (db) => {
      const staff = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const head = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);
      const otherValue = {
        ...SENT_BREAKDOWN,
        valueKey: "E",
        indicatorCodes: ["E2"],
        text: "Teks nilai lain.",
      };
      const otherTahap = {
        ...SENT_BREAKDOWN,
        tahap: "3",
        text: "Teks tahap lain.",
      };

      const saved = [
        await saveStageBreakdown(db, staff, STARTING_VERSION, SENT_BREAKDOWN),
        await saveStageBreakdown(db, head, STARTING_VERSION, otherValue),
        await saveStageBreakdown(db, head, STARTING_VERSION, otherTahap),
      ];

      expect(saved).toEqual([
        { ok: true, value: "Mandiri" },
        { ok: true, value: "Empati" },
        { ok: true, value: "Mandiri" },
      ]);
      expect(await keptText(db)).toEqual([
        "Teks nilai lain.",
        "Teks tahap lain.",
        "Teks uji.",
      ]);
    });
  });

  it("saves twice in a row for one person who loads the page again between the saves", async () => {
    await inTestDatabase(async (db) => {
      const head = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);

      const first = await saveStageBreakdown(
        db,
        head,
        await openedVersion(db, SENT_BREAKDOWN),
        { ...SENT_BREAKDOWN, text: "Teks pertama." },
      );
      const versionAfterFirst = await openedVersion(db, SENT_BREAKDOWN);
      const second = await saveStageBreakdown(db, head, versionAfterFirst, {
        ...SENT_BREAKDOWN,
        text: "Teks kedua.",
      });

      expect(first).toEqual({ ok: true, value: "Mandiri" });
      expect(second).toEqual({ ok: true, value: "Mandiri" });
      expect(await keptText(db)).toEqual(["Teks kedua."]);
      expect(await openedVersion(db, SENT_BREAKDOWN)).not.toBe(
        versionAfterFirst,
      );
    });
  });

  it.each(["", "bukan versi", "2026-03-01"])(
    "refuses a sent version %j that this app never gave, and saves nothing",
    async (version) => {
      await inTestDatabase(async (db) => {
        const head = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);

        const saved = await saveStageBreakdown(
          db,
          head,
          version,
          SENT_BREAKDOWN,
        );

        expect(saved).toEqual(BREAKDOWN_CHANGED_BY_OTHER);
        expect(await db.select().from(stageBreakdowns)).toEqual([]);
      });
    },
  );

  it("refuses the starting version once the box was saved", async () => {
    await inTestDatabase(async (db) => {
      const head = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);
      await saveStageBreakdown(db, head, STARTING_VERSION, SENT_BREAKDOWN);

      const saved = await saveStageBreakdown(db, head, STARTING_VERSION, {
        ...SENT_BREAKDOWN,
        text: "Teks baru.",
      });

      expect(saved).toEqual(BREAKDOWN_CHANGED_BY_OTHER);
      expect(await keptText(db)).toEqual(["Teks uji."]);
    });
  });
});
