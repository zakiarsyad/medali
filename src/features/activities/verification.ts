import { campusTime } from "@/academic-periods/campus-clock";
import { campusDay } from "@/academic-periods/campus-day";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { countedAtEither } from "./counted-students";
import { mayVerify } from "./may-verify";
import type {
  VerificationFilters,
  VerificationParams,
} from "./verification-address";
import { type CardList, readCards } from "./verification-cards";
import {
  readScheduleChoices,
  type ScheduleChoice,
} from "./verification-choices";
import {
  readVerificationNumbers,
  type VerificationNumbers,
} from "./verification-numbers";

/** What the tab "Verifikasi presensi" shows. */
export interface Verification {
  numbers: VerificationNumbers;
  choices: ScheduleChoice[];
  filters: VerificationFilters;
  /**
   * The page of the cards the address asked for. The list may show an
   * earlier one, when the page asked for holds no card any more.
   */
  askedPage: number;
  list: CardList;
}

export type VerificationAnswer =
  | { kind: "refused" }
  | { kind: "found"; verification: Verification };

/**
 * The numbers, the choices of activity and one page of the photo cards,
 * at a moment, for an account that may verify attendance. Anyone else is
 * refused before anything is read. `keepsPhotos` is whether this place
 * has a file storage.
 */
export async function readVerification(
  db: Database,
  account: AccountForAccess,
  params: VerificationParams,
  at: Date,
  keepsPhotos: boolean,
): Promise<VerificationAnswer> {
  if (!mayVerify(account)) return { kind: "refused" };
  const now = { day: campusDay(at), time: campusTime(at) };
  const { filters, page } = params;
  const counted = await countedAtEither(db);
  const [numbers, choices, list] = await Promise.all([
    readVerificationNumbers(db, now, counted),
    readScheduleChoices(db),
    readCards(db, filters, page, keepsPhotos, counted),
  ]);
  return {
    kind: "found",
    verification: { numbers, choices, filters, askedPage: page, list },
  };
}
