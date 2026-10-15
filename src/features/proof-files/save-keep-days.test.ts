import { describe, expect, it } from "vitest";
import { ROLE_IDS } from "@/auth/role-ids";
import { proofFileKeeping } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { NOT_ALLOWED } from "./not-allowed";
import { saveKeepDays } from "./save-keep-days";
import { readKeepDays } from "./stored-keep-days";
import { addTestActor } from "./test-records";

const inTestDatabase = withTestDatabase();

describe("saveKeepDays", () => {
  it("starts with no number set", async () => {
    await inTestDatabase(async (db) => {
      expect(await readKeepDays(db)).toBeNull();
    });
  });

  it("lets Kepala Unit save the days, kept with who set them and when", async () => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);

      const saved = await saveKeepDays(db, actor, "365");

      expect(saved).toEqual({ ok: true, value: 365 });
      expect(await readKeepDays(db)).toBe(365);
      const [row] = await db.select().from(proofFileKeeping);
      expect(row?.setBy).toBe(actor.id);
      expect(row?.setAt).toBeInstanceOf(Date);
    });
  });

  it.each(ROLE_IDS.filter((role) => role !== "head_of_unit"))(
    "refuses %s and saves nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const actor = await addTestActor(db, "Pegawai Uji", [role]);

        const saved = await saveKeepDays(db, actor, "365");

        expect(saved).toEqual(NOT_ALLOWED);
        expect(await db.select().from(proofFileKeeping)).toEqual([]);
      });
    },
  );

  it.each(["", "29", "3651", "abc"])(
    "saves nothing when %j is sent",
    async (sent) => {
      await inTestDatabase(async (db) => {
        const actor = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);

        const saved = await saveKeepDays(db, actor, sent);

        expect(saved.ok).toBe(false);
        expect(await db.select().from(proofFileKeeping)).toEqual([]);
      });
    },
  );

  it("replaces the number set before, keeping one row", async () => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);
      await saveKeepDays(db, actor, "365");

      await saveKeepDays(db, actor, "30");

      expect(await readKeepDays(db)).toBe(30);
      expect(await db.select().from(proofFileKeeping)).toHaveLength(1);
    });
  });

  it("is refused by the database outside 30 to 3650 days", async () => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);

      await expect(
        db
          .insert(proofFileKeeping)
          .values({ keepDays: 29, setAt: new Date(), setBy: actor.id }),
      ).rejects.toThrow();
    });
  });
});
