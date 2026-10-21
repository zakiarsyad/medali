import { afterEach, describe, expect, it } from "vitest";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { accounts, mainIndicators as savedIndicators } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { mainIndicators } from "./main-indicators";
import {
  MAIN_INDICATORS_CHANGED_BY_OTHER,
  saveMainIndicators,
} from "./save-main-indicators";
import { STARTING_VERSION } from "./saved-version";
import { readMainIndicators } from "./stored-main-indicators";
import { addTestActor } from "./test-records";

/*
 * Two saves at the same moment need two connections that both see the
 * same kept texts, so these checks have a database of their own, dropped
 * at the end.
 */
const own = withOwnTestDatabase("indikator");

afterEach(async () => {
  await own.db.delete(savedIndicators);
  await own.db.delete(accounts);
});

type Actor = Pick<Account, "id" | "roles">;

/** A save of every text marked with `mark`, from a form opened on `version`. */
function saveAll(actor: Actor, version: string, mark: string) {
  return (db: Database) =>
    saveMainIndicators(db, actor, version, (code) => `${mark} ${code}`);
}

async function keptTexts(): Promise<string[]> {
  const rows = await own.db
    .select({ text: savedIndicators.text })
    .from(savedIndicators);
  return rows.map(({ text }) => text).sort();
}

function allMarked(mark: string): string[] {
  const indicators = mainIndicators(new Map()).flatMap(
    (value) => value.indicators,
  );
  return indicators.map(({ code }) => `${mark} ${code}`).sort();
}

async function addTwoStaff(): Promise<[Actor, Actor]> {
  const staff = await addTestActor(own.db, "Pegawai Satu", ["upk_staff"]);
  const head = await addTestActor(own.db, "Kepala Dua", ["head_of_unit"]);
  return [staff, head];
}

describe("two staff who save the main indicators at the same moment", () => {
  it("keep one whole save when the texts were never saved: the second waits, then is refused", async () => {
    const [staff, head] = await addTwoStaff();

    const both = await own.atOnce(
      saveAll(staff, STARTING_VERSION, "Pertama"),
      saveAll(head, STARTING_VERSION, "Kedua"),
    );

    expect(both.sooner).toEqual({ ok: true, value: null });
    expect(both.later).toEqual(MAIN_INDICATORS_CHANGED_BY_OTHER);
    expect(await keptTexts()).toEqual(allMarked("Pertama"));
  });

  it("keep one whole save when the texts were saved before: the second waits, then is refused", async () => {
    const [staff, head] = await addTwoStaff();
    await saveAll(staff, STARTING_VERSION, "Awal")(own.db);
    const { version } = await readMainIndicators(own.db);

    const both = await own.atOnce(
      saveAll(staff, version, "Pertama"),
      saveAll(head, version, "Kedua"),
    );

    expect(both.sooner).toEqual({ ok: true, value: null });
    expect(both.later).toEqual(MAIN_INDICATORS_CHANGED_BY_OTHER);
    expect(await keptTexts()).toEqual(allMarked("Pertama"));
  });
});
