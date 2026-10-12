import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import { type Connection, connect } from "@/db/connect";
import { applyTableChanges } from "@/db/migrate";
import type { Parsed } from "@/parsed";
import { readSetting } from "@/settings";
import { placeResident } from "./place-resident";
import {
  addTestProgram,
  addTestRoom,
  addTestStudent,
  residentsOfRoom,
} from "./test-records";

/*
 * Two people at the same moment need two connections that both see the
 * same saved rows, so these checks cannot run inside a transaction that is
 * undone. They get a database of their own, made here and dropped at the
 * end, so no other check ever sees their rows.
 */
const OWN_DATABASE = `medali_test_rooms_${process.pid}`;
const MANAGER = { roles: ["dorm_manager"] as RoleId[] };
/** Long enough for the second save to reach the database and wait there. */
const WAIT_MS = 400;

let admin: Connection;
let first: Connection;
let second: Connection;

function ownDatabaseUrl(): string {
  const url = new URL(readSetting("DATABASE_URL"));
  url.pathname = `/${OWN_DATABASE}`;
  return url.href;
}

beforeAll(async () => {
  admin = connect(readSetting("DATABASE_URL"));
  await admin.db.execute(sql.raw(`create database ${OWN_DATABASE}`));
  first = connect(ownDatabaseUrl());
  second = connect(ownDatabaseUrl());
  await applyTableChanges(first.db);
});

afterAll(async () => {
  await first?.close();
  await second?.close();
  await admin.db.execute(
    sql.raw(`drop database if exists ${OWN_DATABASE} with (force)`),
  );
  await admin.close();
});

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("two people filling the last free place of a room at once", () => {
  it("saves one, and tells the other that the room is full", async () => {
    const program = await addTestProgram(first.db, "Prodi Uji Serentak");
    // Pembibitan, so they live in the dorm without a running period.
    const [one, two] = await Promise.all(
      ["9911260001", "9911260002"].map((nim) =>
        addTestStudent(first.db, program, {
          nim,
          name: `Penghuni Uji ${nim}`,
          isSeedling: true,
        }),
      ),
    );
    if (!one || !two) throw new Error("The residents were not added.");
    const roomId = await addTestRoom(first.db, {
      dorm: "wismantara_putri",
      capacity: 1,
    });

    let later: Promise<Parsed<string>> | undefined;
    let laterIsDone = false;
    const sooner = await first.db.transaction(async (tx) => {
      const placed = await placeResident(tx, MANAGER, {
        roomId,
        studentId: one,
      });
      // The first save is not finished yet: the second one starts now.
      later = placeResident(second.db, MANAGER, { roomId, studentId: two });
      void later.then(() => {
        laterIsDone = true;
      });
      await wait(WAIT_MS);
      expect(laterIsDone).toBe(false);
      return placed;
    });
    const waited = await later;

    expect(sooner.ok).toBe(true);
    expect(waited).toEqual({
      ok: false,
      error: "Kamar sudah penuh. Pilih kamar lain.",
    });
    expect(await residentsOfRoom(first.db, roomId)).toEqual([one]);
  });
});
