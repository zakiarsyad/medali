import { describe, expect, it } from "vitest";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { addTestReplacement } from "@/mentoring/test-replacements";
import { groupCode } from "@/ui/group-code";
import { mentorStatus } from "@/ui/mentor-status";
import { listMentors, MENTOR_PAGE_SIZE } from "./mentor-list";
import {
  type MentorListFilters,
  NO_FILTERS,
  readMentorListParams,
} from "./mentor-list-address";
import { listMentorUnits } from "./mentor-units";
import {
  addTestEndedGroup,
  addTestGroup,
  addTestMembersWithStatus,
  addTestMentor,
  addTestMentorLine,
  addTestMentorRole,
  addTestProgram,
  addTestRoleTaken,
  addTestStudent,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const EVERYONE: RowLimit = { kind: "all" };

/** The unit of the mentors of these checks, which no other record has. */
const UNIT = "Unit Uji Daftar Pengasuh";

function onlyPrograms(studyProgramIds: number[]): RowLimit {
  return { kind: "some", studyProgramIds, menteesOf: [], studentIds: [] };
}

function inTestUnit(filters: Partial<MentorListFilters> = {}) {
  return { ...NO_FILTERS, unit: UNIT, ...filters };
}

async function addMentorWithRole(db: Database, name: string): Promise<string> {
  const id = await addTestMentor(db, { name, unit: UNIT });
  await addTestMentorRole(db, id);
  return id;
}

async function namesFound(
  db: Database,
  limit: RowLimit,
  filters: Partial<MentorListFilters> = {},
): Promise<string[]> {
  const listed = await listMentors(db, limit, inTestUnit(filters), 1);
  return listed.mentors.map((mentor) => mentor.name);
}

/**
 * A mentor of each standing: one who holds a group, one with the role
 * alone, one who lost the role, one who was removed, and one who holds a
 * group although the role is gone.
 */
async function addEachStanding(db: Database): Promise<number> {
  const program = await addTestProgram(db, "UJIDAFTAR");
  const holding = await addMentorWithRole(db, "Pengasuh Uji Dewi");
  await addMentorWithRole(db, "Pengasuh Uji Candra");
  const lost = await addTestMentor(db, {
    name: "Pengasuh Uji Budi",
    unit: UNIT,
  });
  await addTestRoleTaken(db, lost, new Date("2026-03-04T02:00:00Z"));
  const removed = await addTestMentor(db, {
    name: "Pengasuh Uji Ani",
    unit: UNIT,
    deletedAt: new Date("2026-05-06T02:00:00Z"),
  });
  await addTestMentorRole(db, removed);
  const stillHolding = await addTestMentor(db, {
    name: "Pengasuh Uji Eko",
    unit: UNIT,
  });
  const first = await addTestGroup(db, program, { cohortYear: 2024 });
  const second = await addTestGroup(db, program, { cohortYear: 2025 });
  await addTestMentorLine(db, first, holding);
  await addTestMentorLine(db, second, stillHolding);
  return program;
}

describe("listMentors", () => {
  it("gives what a row shows, and never the NIP", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "UJIBARISPG");
      const id = await addTestMentor(db, {
        name: "Pengasuh Uji Baris",
        title: "M.Si.",
        unit: UNIT,
        nip: "990000000000000001",
      });
      await addTestMentorRole(db, id);
      const older = await addTestGroup(db, program, { cohortYear: 2024 });
      const newer = await addTestGroup(db, program, { cohortYear: 2025 });
      await addTestMentorLine(db, older, id);
      await addTestMentorLine(db, newer, id);
      await addTestMembersWithStatus(
        db,
        { id: older, studyProgramId: program },
        9900018001,
        ["active", "active", "on_leave", "inactive"],
      );
      await addTestMembersWithStatus(
        db,
        { id: newer, studyProgramId: program },
        9900018101,
        ["active"],
      );

      const listed = await listMentors(db, EVERYONE, inTestUnit(), 1);

      expect(listed).toEqual({
        matching: 1,
        page: 1,
        mentors: [
          {
            id,
            name: "Pengasuh Uji Baris",
            title: "M.Si.",
            unit: UNIT,
            status: "mentoring",
            inactiveSince: null,
            inactiveReason: null,
            students: 3,
            groups: [
              {
                id: newer,
                mentorId: id,
                cohortYear: 2025,
                entryPath: "regular",
                number: 1,
                programCode: "UJIBARISPG",
                members: 1,
              },
              {
                id: older,
                mentorId: id,
                cohortYear: 2024,
                entryPath: "regular",
                number: 1,
                programCode: "UJIBARISPG",
                members: 2,
              },
            ],
          },
        ],
      });
    });
  });

  it("lists Mengasuh first, then Cadangan, then Tidak aktif, each by name", async () => {
    await inTestDatabase(async (db) => {
      await addEachStanding(db);

      const listed = await listMentors(db, EVERYONE, inTestUnit(), 1);

      expect(
        listed.mentors.map((mentor) => [mentor.name, mentor.status]),
      ).toEqual([
        ["Pengasuh Uji Dewi", "mentoring"],
        ["Pengasuh Uji Eko", "mentoring"],
        ["Pengasuh Uji Candra", "reserve"],
        ["Pengasuh Uji Ani", "inactive"],
        ["Pengasuh Uji Budi", "inactive"],
      ]);
    });
  });

  it("gives each mentor the status the rule works out", async () => {
    await inTestDatabase(async (db) => {
      await addEachStanding(db);
      const standings = {
        "Pengasuh Uji Dewi": {
          groupsHeld: 1,
          hasMentorRole: true,
          leftAsInactive: false,
        },
        "Pengasuh Uji Eko": {
          groupsHeld: 1,
          hasMentorRole: false,
          leftAsInactive: false,
        },
        "Pengasuh Uji Candra": {
          groupsHeld: 0,
          hasMentorRole: true,
          leftAsInactive: false,
        },
        "Pengasuh Uji Budi": {
          groupsHeld: 0,
          hasMentorRole: false,
          leftAsInactive: false,
        },
        "Pengasuh Uji Ani": {
          groupsHeld: 0,
          hasMentorRole: false,
          leftAsInactive: false,
        },
      };

      const listed = await listMentors(db, EVERYONE, inTestUnit(), 1);

      expect(listed.mentors).toHaveLength(5);
      for (const mentor of listed.mentors) {
        const standing = standings[mentor.name as keyof typeof standings];
        expect(mentor.groups).toHaveLength(standing.groupsHeld);
        expect(mentor.status).toBe(mentorStatus(standing));
      }
    });
  });

  it("says since when a mentor is Tidak aktif: the role taken, or the account removed", async () => {
    await inTestDatabase(async (db) => {
      await addEachStanding(db);

      const listed = await listMentors(db, EVERYONE, inTestUnit(), 1);

      expect(
        listed.mentors.map((mentor) => [mentor.name, mentor.inactiveSince]),
      ).toEqual([
        ["Pengasuh Uji Dewi", null],
        ["Pengasuh Uji Eko", null],
        ["Pengasuh Uji Candra", null],
        ["Pengasuh Uji Ani", "2026-05-06"],
        ["Pengasuh Uji Budi", "2026-03-04"],
      ]);
    });
  });

  it("lists one a replacement set Tidak aktif as the rule works out, since its start date and with its reason", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "UJIDAFTARGANTI");
      const retired = await addMentorWithRole(db, "Pengasuh Uji Pensiun");
      const stayed = await addMentorWithRole(db, "Pengasuh Uji Tetap");
      const newMentorId = await addMentorWithRole(db, "Pengasuh Uji Baru");
      const first = await addTestGroup(db, program);
      const second = await addTestGroup(db, program, { number: 2 });
      await addTestMentorLine(db, first, newMentorId);
      await addTestReplacement(db, {
        groupId: first,
        oldMentorId: retired,
        newMentorId,
        startsOn: "2026-09-15",
        reason: "retirement",
        oldMentorStatus: "inactive",
        carriedOutAt: new Date("2026-09-15T02:00:00Z"),
      });
      await addTestReplacement(db, {
        groupId: second,
        oldMentorId: stayed,
        newMentorId,
        startsOn: "2026-09-15",
        carriedOutAt: new Date("2026-09-15T02:00:00Z"),
        cancelledAt: null,
      });

      const listed = await listMentors(db, EVERYONE, inTestUnit(), 1);

      expect(listed.mentors).toMatchObject([
        { id: newMentorId, status: "mentoring", inactiveReason: null },
        { id: stayed, status: "reserve", inactiveReason: null },
        {
          id: retired,
          status: mentorStatus({
            groupsHeld: 0,
            hasMentorRole: true,
            leftAsInactive: true,
          }),
          inactiveSince: "2026-09-15",
          inactiveReason: "Pensiun",
        },
      ]);
    });
  });

  it("keeps one Cadangan while the replacement that would set them Tidak aktif waits for its start date", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "UJIDAFTARTUNGGU");
      const leaving = await addMentorWithRole(db, "Pengasuh Uji Akan Pergi");
      const newMentorId = await addMentorWithRole(db, "Pengasuh Uji Baru");
      const groupId = await addTestGroup(db, program);
      await addTestReplacement(db, {
        groupId,
        oldMentorId: leaving,
        newMentorId,
        oldMentorStatus: "inactive",
      });

      const listed = await listMentors(db, EVERYONE, inTestUnit(), 1);

      expect(listed.mentors).toMatchObject([
        { id: leaving, status: "reserve" },
        { id: newMentorId, status: "reserve" },
      ]);
    });
  });

  it("shows an account that got the role back as Cadangan again", async () => {
    await inTestDatabase(async (db) => {
      const id = await addMentorWithRole(db, "Pengasuh Uji Kembali");
      await addTestRoleTaken(db, id, new Date("2026-03-04T02:00:00Z"));

      const listed = await listMentors(db, EVERYONE, inTestUnit(), 1);

      expect(listed.mentors).toMatchObject([
        { status: "reserve", inactiveSince: null },
      ]);
    });
  });

  it("lists one whose only group is ended as Cadangan, with no group", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "UJIDAFTARAKHIR");
      const id = await addMentorWithRole(db, "Pengasuh Uji Batal");
      const ended = await addTestEndedGroup(db, program);
      await addTestMentorLine(db, ended, id);

      const listed = await listMentors(db, EVERYONE, inTestUnit(), 1);
      const ofProgram = await namesFound(db, onlyPrograms([program]));

      expect(listed.mentors).toMatchObject([
        { id, status: "reserve", groups: [], students: 0 },
      ]);
      expect(ofProgram).toEqual([]);
    });
  });

  it("lists one who held a group before and has no role as Tidak aktif, with no day", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "UJIDULU");
      const id = await addTestMentor(db, {
        name: "Pengasuh Uji Dulu",
        unit: UNIT,
      });
      const group = await addTestGroup(db, program);
      await addTestMentorLine(db, group, id, {
        endsOn: "2026-09-30",
        endReason: "Uji penggantian",
      });

      const listed = await listMentors(db, EVERYONE, inTestUnit(), 1);

      expect(listed.mentors).toMatchObject([
        { status: "inactive", inactiveSince: null, groups: [], students: 0 },
      ]);
    });
  });

  it("lists no staff account that never was a mentor, and no student's account", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "UJIBUKAN");
      await addTestMentor(db, { name: "Pegawai Uji Biasa", unit: UNIT });
      const studentId = await addTestStudent(db, program, {
        nim: "9900018201",
        name: "Mahasiswa Uji Peran",
      });
      const account = await addTestMentor(db, {
        name: "Mahasiswa Uji Peran",
        unit: UNIT,
        studentId,
      });
      await addTestMentorRole(db, account);

      expect(await namesFound(db, EVERYONE)).toEqual([]);
    });
  });

  it("finds mentors by a part of the name, in any letter case", async () => {
    await inTestDatabase(async (db) => {
      await addEachStanding(db);

      expect(await namesFound(db, EVERYONE, { query: "uji bu" })).toEqual([
        "Pengasuh Uji Budi",
      ]);
    });
  });

  it("searches an address with the null character as the same search without it", async () => {
    await inTestDatabase(async (db) => {
      await addEachStanding(db);
      const asked = (q: string) =>
        namesFound(db, EVERYONE, {
          query: readMentorListParams({ q }).filters.query,
        });

      expect(await asked("\0uji\0 bu\0")).toEqual(["Pengasuh Uji Budi"]);
      expect(await asked("\0 \0")).toEqual(await namesFound(db, EVERYONE));
    });
  });

  it("narrows to a status", async () => {
    await inTestDatabase(async (db) => {
      await addEachStanding(db);

      expect(await namesFound(db, EVERYONE, { status: "mentoring" })).toEqual([
        "Pengasuh Uji Dewi",
        "Pengasuh Uji Eko",
      ]);
      expect(await namesFound(db, EVERYONE, { status: "reserve" })).toEqual([
        "Pengasuh Uji Candra",
      ]);
      expect(await namesFound(db, EVERYONE, { status: "inactive" })).toEqual([
        "Pengasuh Uji Ani",
        "Pengasuh Uji Budi",
      ]);
    });
  });

  it("narrows to a unit", async () => {
    await inTestDatabase(async (db) => {
      await addEachStanding(db);
      const other = await addTestMentor(db, {
        name: "Pengasuh Uji Lain",
        unit: "Unit Uji Lain Pengasuh",
      });
      await addTestMentorRole(db, other);

      const found = await namesFound(db, EVERYONE, {
        unit: "Unit Uji Lain Pengasuh",
      });

      expect(found).toEqual(["Pengasuh Uji Lain"]);
    });
  });

  it("gives nothing when no mentor matches", async () => {
    await inTestDatabase(async (db) => {
      await addEachStanding(db);

      const listed = await listMentors(
        db,
        EVERYONE,
        inTestUnit({ query: "tidak ada yang begini" }),
        1,
      );

      expect(listed).toEqual({ mentors: [], matching: 0, page: 1 });
    });
  });

  it("shows a head of a study program only the mentors who hold a group of that program today", async () => {
    await inTestDatabase(async (db) => {
      const program = await addEachStanding(db);
      const other = await addTestProgram(db, "UJILAINPG");
      const elsewhere = await addMentorWithRole(db, "Pengasuh Uji Fajar");
      await addTestMentorLine(db, await addTestGroup(db, other), elsewhere);
      const before = await addMentorWithRole(db, "Pengasuh Uji Gita");
      const third = await addTestGroup(db, program, { number: 3 });
      await addTestMentorLine(db, third, before, { endsOn: "2026-09-30" });

      expect(await namesFound(db, onlyPrograms([program]))).toEqual([
        "Pengasuh Uji Dewi",
        "Pengasuh Uji Eko",
      ]);
      expect(await namesFound(db, onlyPrograms([other]))).toEqual([
        "Pengasuh Uji Fajar",
      ]);
    });
  });

  it("shows a head of a study program only the groups and students of that program", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "UJISENDIRI");
      const other = await addTestProgram(db, "UJITETANGGA");
      const id = await addMentorWithRole(db, "Pengasuh Uji Dua Prodi");
      const own = await addTestGroup(db, program);
      const foreign = await addTestGroup(db, other);
      await addTestMentorLine(db, own, id);
      await addTestMentorLine(db, foreign, id);
      await addTestMembersWithStatus(
        db,
        { id: own, studyProgramId: program },
        9900018301,
        ["active"],
      );
      await addTestMembersWithStatus(
        db,
        { id: foreign, studyProgramId: other },
        9900018401,
        ["active", "active"],
      );

      const limited = await listMentors(
        db,
        onlyPrograms([program]),
        inTestUnit(),
        1,
      );
      const whole = await listMentors(db, EVERYONE, inTestUnit(), 1);

      expect(limited.mentors[0]?.groups.map(groupCode)).toEqual([
        "KP 26-UJISENDIRI-01",
      ]);
      expect(limited.mentors[0]?.students).toBe(1);
      expect(whole.mentors[0]?.groups).toHaveLength(2);
      expect(whole.mentors[0]?.students).toBe(3);
    });
  });

  it("shows no mentor to an account with no study program", async () => {
    await inTestDatabase(async (db) => {
      await addEachStanding(db);

      expect(await namesFound(db, onlyPrograms([]))).toEqual([]);
    });
  });

  it("gives one page of 50 rows, and the last page when asked past it", async () => {
    await inTestDatabase(async (db) => {
      expect(MENTOR_PAGE_SIZE).toBe(50);
      for (let place = 1; place <= MENTOR_PAGE_SIZE + 2; place += 1) {
        const name = `Pengasuh Uji Halaman ${String(place).padStart(2, "0")}`;
        await addMentorWithRole(db, name);
      }

      const first = await listMentors(db, EVERYONE, inTestUnit(), 1);
      const past = await listMentors(db, EVERYONE, inTestUnit(), 9);

      expect(first.mentors).toHaveLength(MENTOR_PAGE_SIZE);
      expect(first.matching).toBe(MENTOR_PAGE_SIZE + 2);
      expect(past.page).toBe(2);
      expect(past.mentors.map((mentor) => mentor.name)).toEqual([
        "Pengasuh Uji Halaman 51",
        "Pengasuh Uji Halaman 52",
      ]);
    });
  });
});

describe("listMentorUnits", () => {
  it("offers the units of the mentors an account may see, by name, each once", async () => {
    await inTestDatabase(async (db) => {
      const program = await addEachStanding(db);
      const other = await addTestMentor(db, {
        name: "Pengasuh Uji Lain",
        unit: "Unit Uji Lain Pengasuh",
      });
      await addTestMentorRole(db, other);
      await addTestMentor(db, { name: "Pegawai Uji", unit: "Unit Uji Bukan" });
      const none = await addTestMentor(db, { name: "Pengasuh Uji Tanpa Unit" });
      await addTestMentorRole(db, none);

      const everyUnit = await listMentorUnits(db, EVERYONE);
      const ofProgram = await listMentorUnits(db, onlyPrograms([program]));

      expect(everyUnit.filter((unit) => unit.startsWith("Unit Uji"))).toEqual([
        UNIT,
        "Unit Uji Lain Pengasuh",
      ]);
      expect(everyUnit).not.toContain("");
      expect(ofProgram).toEqual([UNIT]);
    });
  });
});
