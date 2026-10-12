import { eq, isNull } from "drizzle-orm";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  accounts,
  dormCompanions,
  dormRoomPlaces,
  students,
} from "@/db/schema";

/** Made-up records for the checks of this area. */

export interface TestActor {
  id: string;
  roles: RoleId[];
}

export async function addTestActor(
  db: Database,
  name: string,
  roles: RoleId[],
): Promise<TestActor> {
  const [account] = await db.insert(accounts).values({ name }).returning();
  if (!account) throw new Error("The account was not added.");
  return { id: account.id, roles };
}

/** The student rows an account that sees every student may see. */
export const EVERYONE = isNull(students.deletedAt);

/** The ids of the students who have a place in a room, in no order. */
export async function residentsOfRoom(
  db: Database,
  roomId: string,
): Promise<string[]> {
  const places = await db
    .select({ studentId: dormRoomPlaces.studentId })
    .from(dormRoomPlaces)
    .where(eq(dormRoomPlaces.roomId, roomId));
  return places.map((place) => place.studentId);
}

type TestCompanion = Partial<typeof dormCompanions.$inferInsert>;

/** An active kakak pendamping of Dana Rakca without a room, unless told otherwise. */
export async function addTestCompanion(
  db: Database,
  studentId: string,
  companion: TestCompanion = {},
): Promise<void> {
  await db
    .insert(dormCompanions)
    .values({ studentId, dorm: "dana_rakca", ...companion });
}

/** A kakak pendamping as kept, or undefined for a student who is not one. */
export async function companionOf(db: Database, studentId: string) {
  const [companion] = await db
    .select()
    .from(dormCompanions)
    .where(eq(dormCompanions.studentId, studentId));
  return companion;
}
