import { describe, expect, it } from "vitest";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import { sikuBaseScore } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { NOT_ALLOWED } from "./not-allowed";
import { saveBaseScore } from "./save-base-score";
import { readBaseScore } from "./stored-base-score";
import { addTestActor } from "./test-records";

const inTestDatabase = withTestDatabase();

const MAY_CHANGE: RoleId[] = ["head_of_unit", "upk_staff"];

describe("saveBaseScore", () => {
  it.each(MAY_CHANGE)(
    "lets %s save the score, kept with who set it and when",
    async (role) => {
      await inTestDatabase(async (db) => {
        const actor = await addTestActor(db, "Pegawai Uji", [role]);

        const saved = await saveBaseScore(db, actor, "70");

        expect(saved).toEqual({ ok: true, value: 70 });
        const shown = await readBaseScore(db);
        expect(shown.score).toBe(70);
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

        const saved = await saveBaseScore(db, actor, "70");

        expect(saved).toEqual(NOT_ALLOWED);
        expect(await db.select().from(sikuBaseScore)).toEqual([]);
      });
    },
  );

  it.each(["", "101", "-1"])("saves nothing when %j is sent", async (sent) => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);

      const saved = await saveBaseScore(db, actor, sent);

      expect(saved).toEqual({ ok: false, error: "Nilai dasar harus 0–100." });
      expect(await db.select().from(sikuBaseScore)).toEqual([]);
    });
  });

  it("replaces the score set before, with the one who set it last", async () => {
    await inTestDatabase(async (db) => {
      const first = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const second = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);
      await saveBaseScore(db, first, "70");

      await saveBaseScore(db, second, "0");

      const shown = await readBaseScore(db);
      expect(shown.score).toBe(0);
      expect(shown.changed?.by).toBe("Kepala Uji");
      expect(await db.select().from(sikuBaseScore)).toHaveLength(1);
    });
  });
});
