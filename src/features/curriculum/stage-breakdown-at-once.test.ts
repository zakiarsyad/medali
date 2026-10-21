import { sql } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { accounts, stageBreakdowns } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import type { SentBreakdown } from "./breakdown-input";
import {
  BREAKDOWN_CHANGED_BY_OTHER,
  saveStageBreakdown,
} from "./save-stage-breakdown";
import { STARTING_VERSION } from "./saved-version";
import { readStageBreakdowns } from "./stored-stage-breakdowns";
import { addTestActor, SENT_BREAKDOWN } from "./test-records";

/*
 * Two saves at the same moment need two connections that both see the
 * same kept box, so these checks have a database of their own, dropped at
 * the end.
 */
const own = withOwnTestDatabase("penjabaran");

afterEach(async () => {
  await own.db.delete(stageBreakdowns);
  await own.db.delete(accounts);
});

type Actor = Pick<Account, "id" | "roles">;

const FIRST: SentBreakdown = {
  ...SENT_BREAKDOWN,
  text: "Teks pertama.",
  activities: ["Kegiatan pertama"],
  indicatorCodes: ["M1"],
};

const SECOND: SentBreakdown = {
  ...SENT_BREAKDOWN,
  text: "Teks kedua.",
  activities: ["Kegiatan kedua"],
  indicatorCodes: ["M4"],
};

function save(actor: Actor, version: string, sent: SentBreakdown) {
  return (db: Database) => saveStageBreakdown(db, actor, version, sent);
}

async function keptBoxes() {
  return own.db
    .select({
      text: stageBreakdowns.text,
      activities: stageBreakdowns.activities,
      indicatorCodes: stageBreakdowns.indicatorCodes,
    })
    .from(stageBreakdowns);
}

async function addTwoStaff(): Promise<[Actor, Actor]> {
  const staff = await addTestActor(own.db, "Pegawai Satu", ["upk_staff"]);
  const head = await addTestActor(own.db, "Kepala Dua", ["head_of_unit"]);
  return [staff, head];
}

describe("two staff who save the same Penjabaran box at the same moment", () => {
  it("keep one whole save when the box was never saved: the second waits, then is refused", async () => {
    const [staff, head] = await addTwoStaff();

    const both = await own.atOnce(
      save(staff, STARTING_VERSION, FIRST),
      save(head, STARTING_VERSION, SECOND),
    );

    expect(both.sooner).toEqual({ ok: true, value: "Mandiri" });
    expect(both.later).toEqual(BREAKDOWN_CHANGED_BY_OTHER);
    expect(await keptBoxes()).toEqual([
      {
        text: "Teks pertama.",
        activities: ["Kegiatan pertama"],
        indicatorCodes: ["M1"],
      },
    ]);
  });

  it("keep one whole save when the box was saved before: the second waits, then is refused", async () => {
    const [staff, head] = await addTwoStaff();
    await save(staff, STARTING_VERSION, SENT_BREAKDOWN)(own.db);
    const shown = await readStageBreakdowns(own.db);
    const version = shown[1]?.values[0]?.version ?? "";

    const both = await own.atOnce(
      save(staff, version, FIRST),
      save(head, version, SECOND),
    );

    expect(both.sooner).toEqual({ ok: true, value: "Mandiri" });
    expect(both.later).toEqual(BREAKDOWN_CHANGED_BY_OTHER);
    expect(await keptBoxes()).toEqual([
      {
        text: "Teks pertama.",
        activities: ["Kegiatan pertama"],
        indicatorCodes: ["M1"],
      },
    ]);
  });
});

describe("two staff who save different Penjabaran boxes at the same moment", () => {
  it("save both, without the second waiting for the first", async () => {
    const [staff, head] = await addTwoStaff();
    const otherTahap = { ...SECOND, tahap: "3" };

    const both = await own.db.transaction(async (tx) => {
      const sooner = await save(staff, STARTING_VERSION, FIRST)(tx);
      // Saved while the first one is not finished: had it to wait for the
      // first, it would wait for ever, so it gives up after a second.
      const later = await own.otherDb.transaction(async (otherTx) => {
        await otherTx.execute(sql`set local lock_timeout = '1s'`);
        return save(head, STARTING_VERSION, otherTahap)(otherTx);
      });
      return [sooner, later];
    });

    expect(both).toEqual([
      { ok: true, value: "Mandiri" },
      { ok: true, value: "Mandiri" },
    ]);
    expect(await own.db.select().from(stageBreakdowns)).toHaveLength(2);
  });
});
