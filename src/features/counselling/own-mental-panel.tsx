import type { AccountForAccess } from "@/auth/access";
import { database } from "@/db/database";
import { readCampusCounsellingContact } from "@/settings";
import { readOwnMental } from "./own-mental";
import { OwnMentalView } from "./own-mental-view";

/**
 * "Kesehatan mental" of the student of the account, for Profil saya. An
 * account without the right, or without a student, gets nothing at all.
 */
export async function OwnMentalPanel({
  account,
}: {
  account: AccountForAccess;
}) {
  const mental = await readOwnMental(database(), account);
  if (mental === null) return null;
  return (
    <OwnMentalView mental={mental} contact={readCampusCounsellingContact()} />
  );
}
