import { PHOTOS_MAX } from "./request-ids";
import {
  ONLY_PICTURES,
  PHOTO_TOO_LARGE,
  PICKED_PHOTO_MAX_BYTES,
  TOO_MANY_PHOTOS,
} from "./request-photo";

/*
 * Which picked files the form of a request takes as photos. Read by the
 * form in the browser, so nothing here may take from the database code.
 */

/** A picked file, as far as the browser tells before it is read. */
export interface PickedFile {
  type: string;
  size: number;
}

/** JPG and PNG only: other kinds of picture can carry code. */
const TAKEN_KINDS = ["image/jpeg", "image/png"];

/** What the file chooser offers; what is picked is checked again here. */
export const CHOOSER_KINDS = TAKEN_KINDS.join(",");

/** The files taken, and what was wrong with one left out, or null. */
export interface Picks<File> {
  taken: File[];
  fault: string | null;
}

function faultOf(file: PickedFile): string | null {
  if (!TAKEN_KINDS.includes(file.type)) return ONLY_PICTURES;
  if (file.size === 0) return ONLY_PICTURES;
  if (file.size > PICKED_PHOTO_MAX_BYTES) return PHOTO_TOO_LARGE;
  return null;
}

/**
 * The picked files the form takes, when it holds `held` photos already:
 * JPG and PNG files of 5 MB at most, in the order picked, until it holds
 * three. The first thing wrong with a file left out is said.
 */
export function takenPicks<File extends PickedFile>(
  held: number,
  picked: readonly File[],
): Picks<File> {
  const taken: File[] = [];
  let fault: string | null = null;
  for (const file of picked) {
    const wrong = faultOf(file);
    const isFull = held + taken.length >= PHOTOS_MAX;
    if (wrong === null && !isFull) {
      taken.push(file);
      continue;
    }
    fault ??= wrong ?? TOO_MANY_PHOTOS;
  }
  return { taken, fault };
}
