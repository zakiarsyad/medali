// Sample Tahun akademik of this file: 3158 to 3158.
// Sample NIMs of this file: 9982080000 to 9982080099.
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { academicPeriods, dormViolationAppeals } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { decideViolationAppeal } from "./decide-appeal";
import { readOwnViolations } from "./own-violations";
import { reduceViolations } from "./reduce-violations";
import { saveViolations } from "./save-violations";
import { sendViolationAppeal } from "./send-appeal";
import {
  addViolationActor,
  addViolationSetting,
  sentList,
  sentRow,
} from "./test-violations";
import type { OwnViolationParams } from "./violation-address";
import { recordStatus } from "./violation-status";

const inTestDatabase = withTestDatabase();

// 22:00 on campus on 3 February 3159, in the even semester.
const NOW = new Date("3159-02-03T15:00:00Z");
const FIRST: OwnViolationParams = {
  periodId: null,
  page: 1,
  day: null,
  announcementPage: 1,
};

function morningOf(day: string): Date {
  return new Date(`${day}T10:00:00+07:00`);
}

/**
 * Ani has one violation of the odd semester and one of the even one, gone
 * up, and one announced at 20:00 today; Bea, of her dorm, one of today;
 * Dodi, of Cipta Bakti, one of today; Cici one waiting for 23:00.
 */
async function setUp(db: Database) {
  const setting = await addViolationSetting(
    db,
    3158,
    "Prodi Uji Pelanggaran Saya",
    ["9982080001", "9982080002", "9982080003", "9982080004", "9982080005"],
  );
  const [even] = await db
    .insert(academicPeriods)
    .values({
      startYear: 3158,
      term: "even",
      startsOn: "3159-02-01",
      endsOn: "3159-07-31",
    })
    .returning();
  const [ani = "", bea = "", cici = ""] = setting.residents;
  const bam = await addViolationActor(db, "BAM Uji Saya", ["bam_bphk"]);
  async function save(day: string, ids: string[], time = "21:00") {
    const list = sentList(
      day,
      ids.map((id) => sentRow(id)),
      {
        announceTime: time,
      },
    );
    const saved = await saveViolations(
      db,
      bam,
      crypto.randomUUID(),
      list,
      morningOf(day),
    );
    if (!saved.ok) throw new Error(saved.error);
  }
  await save("3159-01-20", [ani]);
  await save("3159-02-02", [ani]);
  await save("3159-02-03", [ani, bea, setting.otherDorm], "20:00");
  await save("3159-02-03", [cici], "23:00");
  const resident = (studentId: string, roles: RoleId[] = ["student"]) =>
    addViolationActor(db, `Akun ${studentId.slice(0, 8)}`, roles, studentId);
  return {
    ani: await resident(ani),
    dodi: await resident(setting.otherDorm),
    outsider: await resident(setting.outsider),
    evenId: even?.id ?? "",
  };
}

describe("readOwnViolations", () => {
  it("counts the resident's own violations of the running semester that went up, and lists their own of it", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await setUp(db);

      const own = await readOwnViolations(db, ani, FIRST, NOW);

      if (own.kind !== "shown") throw new Error("It was refused.");
      expect(own.recorded).toBe(1);
      expect(own.dorm).toBe("dana_rakca");
      expect(own.history.rows.map((row) => row.day)).toEqual([
        "3159-02-03",
        "3159-02-02",
      ]);
      expect(
        own.history.rows.every((row) => row.name === "Ani Uji Pelanggaran"),
      ).toBe(true);
    });
  });

  it("shows the resident their reduced violation as Dikurangi with its reason, which no longer counts nor is announced", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await setUp(db);
      const manager = await addViolationActor(db, "Pengelola Uji Saya", [
        "dorm_manager",
      ]);
      const before = await readOwnViolations(db, ani, FIRST, NOW);
      if (before.kind !== "shown") throw new Error("It was refused.");
      const gone = before.history.rows.find((row) => row.day === "3159-02-02");
      const reason = "Terbukti sedang izin resmi pada jam itu.";
      await reduceViolations(
        db,
        manager,
        {
          studentId: ani.studentId,
          violationIds: [gone?.id],
          reason,
        },
        NOW,
      );

      const own = await readOwnViolations(
        db,
        ani,
        { ...FIRST, day: "3159-02-02" },
        NOW,
      );

      if (own.kind !== "shown") throw new Error("It was refused.");
      expect(before.recorded).toBe(1);
      expect(own.recorded).toBe(0);
      const reduced = own.history.rows.find((row) => row.id === gone?.id);
      expect(reduced).toMatchObject({ reduced: true, reductionReason: reason });
      expect(reduced).not.toHaveProperty("reducedAt");
      expect(
        recordStatus(
          reduced?.announcedAt ?? NOW,
          reduced?.appeal ?? null,
          reduced?.reduced ?? false,
          NOW,
        ),
      ).toBe("reduced");
      expect(own.announcement.rows.map((row) => row.id)).not.toContain(
        gone?.id,
      );
    });
  });

  it("shows the resident their own appeal with its reason, and the announcement no appeal of anyone", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await setUp(db);
      const before = await readOwnViolations(db, ani, FIRST, NOW);
      if (before.kind !== "shown") throw new Error("It was refused.");
      const today = before.history.rows[0]?.id ?? "";
      const reason = "Saya sedang izin resmi pada jam tersebut.";
      const appealed = await sendViolationAppeal(
        db,
        null,
        ani,
        { violationId: today, reason, file: null },
        NOW,
      );
      if (!appealed.ok) throw new Error(appealed.error);

      const own = await readOwnViolations(db, ani, FIRST, NOW);

      if (own.kind !== "shown") throw new Error("It was refused.");
      expect(own.history.rows.map((row) => row.ownAppeal)).toEqual([
        {
          id: expect.any(String),
          status: "waiting",
          reason,
          note: "",
          proofName: null,
          removed: null,
        },
        null,
      ]);
      for (const row of own.announcement.rows) {
        expect(JSON.stringify(row)).not.toContain(reason);
      }
    });
  });

  it("says when the proof of the resident's appeal was removed as old proof, and names it no more", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await setUp(db);
      const before = await readOwnViolations(db, ani, FIRST, NOW);
      if (before.kind !== "shown") throw new Error("It was refused.");
      const today = before.history.rows[0]?.id ?? "";
      await db.insert(dormViolationAppeals).values({
        violationId: today,
        reason: "Saya sedang izin resmi pada jam tersebut.",
        fileName: "bukti-izin.pdf",
        fileContentType: "application/pdf",
        fileSize: 64,
        fileRemovedAt: new Date("3159-02-03T03:00:00Z"),
        sentAt: NOW,
      });

      const own = await readOwnViolations(db, ani, FIRST, NOW);

      if (own.kind !== "shown") throw new Error("It was refused.");
      expect(own.history.rows[0]?.ownAppeal).toMatchObject({
        status: "waiting",
        proofName: null,
        removed: "Berkas sudah dihapus pada 3 Feb 3159.",
      });
    });
  });

  it("counts an appeal that waits under Dalam masa advokasi, and an accepted one under Advokasi diterima, never as Pelanggaran tercatat", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await setUp(db);
      const before = await readOwnViolations(db, ani, FIRST, NOW);
      if (before.kind !== "shown") throw new Error("It was refused.");
      const today = before.history.rows[0]?.id ?? "";
      const appealed = await sendViolationAppeal(
        db,
        null,
        ani,
        {
          violationId: today,
          reason: "Saya sedang izin resmi pada jam itu.",
          file: null,
        },
        NOW,
      );
      if (!appealed.ok) throw new Error(appealed.error);
      // A day later, long after the appeal time.
      const later = new Date(NOW.getTime() + 24 * 60 * 60 * 1000);
      const waiting = await readOwnViolations(db, ani, FIRST, later);
      const [appeal] = await db.select().from(dormViolationAppeals);
      const ki = await addViolationActor(db, "BAM Uji Saya KI", [
        "bam_compliance",
      ]);
      await decideViolationAppeal(
        db,
        ki,
        appeal?.id ?? "",
        { kind: "accept", note: "Izin tercatat." },
        later,
      );
      const accepted = await readOwnViolations(db, ani, FIRST, later);

      if (waiting.kind !== "shown" || accepted.kind !== "shown") {
        throw new Error("It was refused.");
      }
      expect([before.recorded, before.inAppeal, before.accepted]).toEqual([
        1, 1, 0,
      ]);
      expect([waiting.recorded, waiting.inAppeal, waiting.accepted]).toEqual([
        1, 1, 0,
      ]);
      expect([accepted.recorded, accepted.inAppeal, accepted.accepted]).toEqual(
        [1, 0, 1],
      );
      expect(accepted.history.rows[0]?.ownAppeal?.note).toBe("Izin tercatat.");
    });
  });

  it("lists every period's own violations for Semua periode", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await setUp(db);

      const own = await readOwnViolations(
        db,
        ani,
        { ...FIRST, periodId: "all" },
        NOW,
      );

      if (own.kind !== "shown") throw new Error("It was refused.");
      expect(own.shownPeriod).toBe("all");
      expect(own.history.matching).toBe(3);
    });
  });

  it("shows the announcement of the resident's own dorm only, and nothing before its hour", async () => {
    await inTestDatabase(async (db) => {
      const { ani, dodi } = await setUp(db);

      const ofAni = await readOwnViolations(db, ani, FIRST, NOW);
      const ofDodi = await readOwnViolations(db, dodi, FIRST, NOW);

      if (ofAni.kind !== "shown" || ofDodi.kind !== "shown") {
        throw new Error("It was refused.");
      }
      expect(ofAni.announcement.rows.map((row) => row.name)).toEqual([
        "Ani Uji Pelanggaran",
        "Bea Uji Pelanggaran",
      ]);
      expect(ofDodi.announcement.rows.map((row) => row.name)).toEqual([
        "Dodi Uji Pelanggaran",
      ]);
      expect(ofDodi.announcement.days.map((each) => each.day)).toEqual([
        "3159-02-03",
      ]);
    });
  });

  it("refuses a student who lives in no dorm, and an account without the right", async () => {
    await inTestDatabase(async (db) => {
      const { outsider, ani } = await setUp(db);
      const staff = await addViolationActor(db, "Pengelola Uji Saya", [
        "dorm_manager",
      ]);

      expect(await readOwnViolations(db, outsider, FIRST, NOW)).toEqual({
        kind: "refused",
      });
      expect(await readOwnViolations(db, staff, FIRST, NOW)).toEqual({
        kind: "refused",
      });
      expect(
        await readOwnViolations(
          db,
          { ...ani, roles: ["bam_bphk"] },
          FIRST,
          NOW,
        ),
      ).toEqual({ kind: "refused" });
    });
  });
});
