import { isNull } from "drizzle-orm";
import { mentorGroups } from "@/db/schema";

/**
 * A group that is in force. One whose penetapan was cancelled is ended:
 * it stays stored, and no read of groups shows it.
 */
export const NOT_ENDED = isNull(mentorGroups.endedAt);
