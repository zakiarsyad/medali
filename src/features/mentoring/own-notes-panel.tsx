import type { AccountForAccess } from "@/auth/access";
import { database } from "@/db/database";
import { readOwnNotes } from "./own-notes";
import { OwnNotesView } from "./own-notes-view";

/**
 * "Catatan pengasuhan" of the student of the account, for Profil saya, to
 * read only. An account without the right gets nothing at all.
 */
export async function OwnNotesPanel({
  account,
}: {
  account: AccountForAccess;
}) {
  const notes = await readOwnNotes(database(), account);
  if (notes === null) return null;
  return <OwnNotesView notes={notes} />;
}
