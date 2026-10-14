import { describe, expect, it } from "vitest";
import { type AccountForAccess, may } from "@/auth/access";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { readMentor } from "./mentor-detail";
import { mentorAddress } from "./mentor-list-address";
import { openMentorAddress } from "./open-mentor-address";
import {
  addTestGroup,
  addTestMentor,
  addTestMentorLine,
  addTestMentorRole,
  addTestProgram,
} from "./test-records";
import { mentorRowsFor } from "./visible-mentors";

const inTestDatabase = withTestDatabase();

const MENTOR_ID = "00000000-0000-4000-8000-000000000002";
const GROUP = { studyProgramId: 7 };

function account(
  roles: RoleId[],
  studyProgramId: number | null = null,
): AccountForAccess {
  return { id: "a", roles, studyProgramId, studentId: null };
}

describe("openMentorAddress", () => {
  it.each(["head_of_unit", "director", "upk_staff"] as const)(
    "gives %s the address of the page of any group's mentor",
    (role) => {
      expect(openMentorAddress(account([role]), MENTOR_ID, GROUP)).toBe(
        mentorAddress(MENTOR_ID),
      );
    },
  );

  it("gives Ketua Program Studi the address for the mentor of a group of their program", () => {
    const head = account(["head_of_program"], 7);

    expect(openMentorAddress(head, MENTOR_ID, GROUP)).toBe(
      mentorAddress(MENTOR_ID),
    );
  });

  it("gives Ketua Program Studi none for the mentor of a group of another program", () => {
    const other = account(["head_of_program"], 8);
    const without = account(["head_of_program"]);

    expect(openMentorAddress(other, MENTOR_ID, GROUP)).toBeNull();
    expect(openMentorAddress(without, MENTOR_ID, GROUP)).toBeNull();
  });

  it("gives none to every role without the right to see mentors", () => {
    const others = ROLE_IDS.filter((role) => !may([role], "view_mentors"));

    expect(others).toContain("mentor");
    expect(others).toContain("student");
    expect(others).toContain("counsellor");
    for (const role of others) {
      expect(
        openMentorAddress(account([role], 7), MENTOR_ID, GROUP),
      ).toBeNull();
    }
  });

  it("lets only the roles that may see mentors decide for an account with several roles", () => {
    const seesEveryStudent = account(["counsellor", "head_of_program"], 8);
    const ownProgram = account(["counsellor", "head_of_program"], 7);
    const alsoStaff = account(["head_of_program", "upk_staff"], 8);

    expect(openMentorAddress(seesEveryStudent, MENTOR_ID, GROUP)).toBeNull();
    expect(openMentorAddress(ownProgram, MENTOR_ID, GROUP)).toBe(
      mentorAddress(MENTOR_ID),
    );
    expect(openMentorAddress(alsoStaff, MENTOR_ID, GROUP)).toBe(
      mentorAddress(MENTOR_ID),
    );
  });
});

/** A mentor with the Pengasuh role who holds today one group per program given. */
async function addHoldingMentor(
  db: Database,
  name: string,
  programIds: number[],
) {
  const mentorId = await addTestMentor(db, { name });
  await addTestMentorRole(db, mentorId);
  const held = [];
  for (const studyProgramId of programIds) {
    const groupId = await addTestGroup(db, studyProgramId);
    await addTestMentorLine(db, groupId, mentorId);
    held.push({ mentorId, studyProgramId });
  }
  return held;
}

/** Whether the mentor's page answers this account with the mentor. */
async function opensMentorPage(
  db: Database,
  viewer: AccountForAccess,
  mentorId: string,
): Promise<boolean> {
  const limit = mentorRowsFor(viewer);
  if (limit === null) return false;
  const answer = await readMentor(db, limit, mentorId, null);
  return answer.kind === "found";
}

function viewersOf(first: number, second: number): AccountForAccess[] {
  return [
    account(["head_of_unit"]),
    account(["director"]),
    account(["upk_staff"]),
    account(["head_of_program"], first),
    account(["head_of_program"], second),
    account(["head_of_program"]),
    account(["counsellor", "head_of_program"], second),
    account(["head_of_program", "upk_staff"], second),
    account(["mentor"], first),
    account(["counsellor"], first),
    account(["student"], first),
  ];
}

describe("openMentorAddress and the mentor's page", () => {
  it("gives an address exactly when the page answers with the mentor, for a mentor of one program", async () => {
    await inTestDatabase(async (db) => {
      const first = await addTestProgram(db, "UJIALAMATSATU");
      const second = await addTestProgram(db, "UJIALAMATDUA");
      const held = [
        ...(await addHoldingMentor(db, "Pengasuh Uji Alamat Satu", [first])),
        ...(await addHoldingMentor(db, "Pengasuh Uji Alamat Dua", [second])),
      ];
      let links = 0;

      for (const viewer of viewersOf(first, second)) {
        for (const { mentorId, studyProgramId } of held) {
          const address = openMentorAddress(viewer, mentorId, {
            studyProgramId,
          });
          const opens = await opensMentorPage(db, viewer, mentorId);

          expect(address !== null).toBe(opens);
          if (address !== null) links += 1;
        }
      }
      // 4 all-seeing accounts with 2 mentors each, and 3 limited ones with 1.
      expect(links).toBe(11);
    });
  });

  it("never gives an address the page refuses, for a mentor who holds groups of two programs", async () => {
    await inTestDatabase(async (db) => {
      const first = await addTestProgram(db, "UJIALAMATSATU");
      const second = await addTestProgram(db, "UJIALAMATDUA");
      const held = await addHoldingMentor(db, "Pengasuh Uji Alamat Ganda", [
        first,
        second,
      ]);
      const [ofFirst, ofSecond] = held;
      if (!ofFirst || !ofSecond) throw new Error("The groups were not added.");
      const headOfFirst = account(["head_of_program"], first);

      for (const viewer of viewersOf(first, second)) {
        for (const { mentorId, studyProgramId } of held) {
          const address = openMentorAddress(viewer, mentorId, {
            studyProgramId,
          });
          if (address === null) continue;

          expect(await opensMentorPage(db, viewer, mentorId)).toBe(true);
        }
      }
      expect(
        openMentorAddress(headOfFirst, ofFirst.mentorId, ofFirst),
      ).not.toBeNull();
      expect(
        openMentorAddress(headOfFirst, ofSecond.mentorId, ofSecond),
      ).toBeNull();
    });
  });
});
