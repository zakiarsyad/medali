import { eq } from "drizzle-orm";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  mentorGroupMembers,
  mentorGroupMentors,
  mentorGroups,
  students,
} from "@/db/schema";
import { askSharing } from "./change-sharing";
import { changeSharingAsCounsellor } from "./publish-sharing";
import type { SharedData, SharingRecipient } from "./sharing-ids";
import type { SharingView } from "./sharing-view";
import { addTestActor } from "./test-consents";
import { ASKED_AT, type SharingStudent } from "./test-sharings";

/** Made-up published sharings and their recipients, for the checks of this area. */

export const RECORDED_AT = new Date(ASKED_AT.getTime() + 60_000);

export const PUBLISHED_AT = new Date(ASKED_AT.getTime() + 120_000);

export const TEST_SUMMARY = "Mahasiswa sedang dalam pendampingan rutin.";

/** What Konselor shares with whom in a check. */
export interface TestShare {
  data: SharedData[];
  recipients: SharingRecipient[];
}

function viewOf(
  outcome: Awaited<ReturnType<typeof changeSharingAsCounsellor>>,
): SharingView {
  if (outcome.kind !== "kept" || outcome.sharing === null) {
    throw new Error("The sharing step was not kept.");
  }
  return outcome.sharing;
}

/**
 * A sharing the test Konselor asked for, recorded on paper and left
 * Disetujui, not yet published.
 */
export async function approveTestSharing(
  db: Database,
  people: SharingStudent,
  share: TestShare,
): Promise<SharingView> {
  const summary = share.data.includes("summary") ? TEST_SUMMARY : "";
  const asked = viewOf(
    await askSharing(
      db,
      people.counsellor,
      people.studentId,
      { ...share, summary },
      ASKED_AT,
    ),
  );
  return viewOf(
    await changeSharingAsCounsellor(
      db,
      people.counsellor,
      people.studentId,
      "record_paper",
      asked.id,
      asked.version,
      RECORDED_AT,
    ),
  );
}

/** A sharing the test Konselor asked for, recorded on paper and published. */
export async function publishTestSharing(
  db: Database,
  people: SharingStudent,
  share: TestShare,
): Promise<SharingView> {
  const approved = await approveTestSharing(db, people, share);
  return viewOf(
    await changeSharingAsCounsellor(
      db,
      people.counsellor,
      people.studentId,
      "publish",
      approved.id,
      approved.version,
      PUBLISHED_AT,
    ),
  );
}

async function programOf(db: Database, studentId: string): Promise<number> {
  const [found] = await db
    .select({ programId: students.studyProgramId })
    .from(students)
    .where(eq(students.id, studentId));
  if (!found) throw new Error("The student was not found.");
  return found.programId;
}

/** A recipient of these roles, of the student's program for Ketua Program Studi. */
export async function addTestRecipient(
  db: Database,
  roles: RoleId[],
  studentId: string,
): Promise<AccountForAccess> {
  const actor = await addTestActor(db, "Penerima Uji", roles);
  return { ...actor, studyProgramId: await programOf(db, studentId) };
}

/**
 * A Pengasuh who holds today a group of the student's program with the
 * student in it. `number` keeps two groups of one program apart.
 */
export async function addTestMentorOf(
  db: Database,
  studentId: string,
  number = 1,
): Promise<{ mentor: AccountForAccess; lineId: string }> {
  const [group] = await db
    .insert(mentorGroups)
    .values({
      studyProgramId: await programOf(db, studentId),
      cohortYear: 2026,
      entryPath: "regular",
      number,
      startsOn: "2026-09-01",
    })
    .returning({ id: mentorGroups.id });
  if (!group) throw new Error("The mentor group was not added.");
  await db.insert(mentorGroupMembers).values({ studentId, groupId: group.id });
  const mentor = await addTestActor(db, "Pengasuh Uji", ["mentor"]);
  const [line] = await db
    .insert(mentorGroupMentors)
    .values({ groupId: group.id, mentorId: mentor.id, startsOn: "2026-09-01" })
    .returning({ id: mentorGroupMentors.id });
  if (!line) throw new Error("The mentor line was not added.");
  return { mentor, lineId: line.id };
}
