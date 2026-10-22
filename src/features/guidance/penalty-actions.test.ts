// Sample NIMs of this file: 9944300000 to 9944300099.
import { describe, expect, it, vi } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import {
  changePenaltyStatusAction,
  openPenaltyAction,
} from "./penalty-actions";
import { PENALTY_OUTDATED } from "./penalty-messages";
import {
  addTestPenalty,
  penaltyAt,
  penaltyLinesOf,
} from "./test-discipline-penalties";
import { addNoteActor, addNoteStudents } from "./test-violation-notes";

const signedIn = vi.hoisted(() => ({
  db: null as Database | null,
  account: null as AccountForAccess | null,
}));

vi.mock("@/auth/current-account", () => ({
  currentAccount: async () => signedIn.account,
}));
vi.mock("@/db/database", () => ({ database: () => signedIn.db }));

const inTestDatabase = withTestDatabase();

describe("changePenaltyStatusAction", () => {
  it.each([2 ** 31 - 1, 2 ** 31, 2 ** 40, -1, 0, 1.5])(
    "refuses the version %s, which the database cannot hold or never keeps, as outdated, and keeps nothing",
    async (version) => {
      await inTestDatabase(async (db) => {
        const officer = await addNoteActor(db, "Pembina Uji Aksi", [
          "discipline_officer",
        ]);
        const { studentIds } = await addNoteStudents(
          db,
          "Prodi Uji Aksi Hukuman",
          "Mahasiswa Uji Aksi Hukuman",
          ["9944300001"],
        );
        const id = await addTestPenalty(
          db,
          studentIds[0] ?? "",
          officer.id,
          "2026-10-12",
        );
        signedIn.db = db;
        signedIn.account = officer;

        const answer = await changePenaltyStatusAction(id, version, "served");

        expect(answer.error).toBe(PENALTY_OUTDATED.error);
        expect(answer.followUp).toEqual(
          expect.objectContaining({ status: "imposed", version: 1 }),
        );
        expect(await penaltyAt(db, id)).toEqual(
          expect.objectContaining({ status: "imposed", version: 1 }),
        );
        expect(await penaltyLinesOf(db, id)).toHaveLength(1);
      });
    },
  );
});

describe("openPenaltyAction", () => {
  async function addPenalty(db: Database) {
    const officer = await addNoteActor(db, "Pembina Uji Buka Rincian", [
      "discipline_officer",
    ]);
    const { studentIds } = await addNoteStudents(
      db,
      "Prodi Uji Buka Rincian",
      "Mahasiswa Uji Buka Rincian",
      ["9944300011"],
    );
    const id = await addTestPenalty(
      db,
      studentIds[0] ?? "",
      officer.id,
      "2026-10-12",
      { decisionNumber: "KEP-03/UJI" },
    );
    signedIn.db = db;
    return { officer, id };
  }

  it("gives an account that reads discipline records the Rincian of one penalty", async () => {
    await inTestDatabase(async (db) => {
      const { officer, id } = await addPenalty(db);
      signedIn.account = officer;

      expect(await openPenaltyAction(id)).toEqual(
        expect.objectContaining({
          id,
          description: "Terlambat mengikuti apel pagi tiga kali",
          decisionNumber: "KEP-03/UJI",
        }),
      );
      expect(await openPenaltyAction("bukan-kunci")).toBeNull();
    });
  });

  it("refuses an account without the tab before anything is read", async () => {
    await inTestDatabase(async (db) => {
      const { id } = await addPenalty(db);
      signedIn.account = await addNoteActor(db, "Konselor Uji Buka Rincian", [
        "counsellor",
      ]);

      await expect(openPenaltyAction(id)).rejects.toThrow();
      signedIn.account = null;
      await expect(openPenaltyAction(id)).rejects.toThrow();
    });
  });
});
