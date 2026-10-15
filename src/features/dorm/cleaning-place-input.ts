import { DORM_IDS, type DormId } from "@/dorms/dorms";
import type { Parsed } from "@/parsed";
import { PLACE_NAME_MAX_LENGTH, PLACE_NAME_MIN_LENGTH } from "./cleaning-ids";
import {
  DORM_REFUSED,
  NAME_TOO_LONG,
  NAME_TOO_SHORT,
} from "./cleaning-messages";

/**
 * The name of a cleaning place as kept: without the spaces around it. Its
 * letters are counted as the database counts them, so a sign such as an
 * emoji counts once.
 */
export function parsePlaceName(sent: string): Parsed<string> {
  const name = sent.trim();
  const letters = [...name].length;
  if (letters < PLACE_NAME_MIN_LENGTH) return NAME_TOO_SHORT;
  if (letters > PLACE_NAME_MAX_LENGTH) return NAME_TOO_LONG;
  return { ok: true, value: name };
}

export function parseDorm(sent: string): Parsed<DormId> {
  const dorm = DORM_IDS.find((id) => id === sent);
  if (!dorm) return DORM_REFUSED;
  return { ok: true, value: dorm };
}
