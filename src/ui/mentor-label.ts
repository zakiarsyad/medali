import type { accounts } from "@/db/schema";

/** A mentor's name, with the gelar after it when there is one. */
export function mentorLabel(
  mentor: Pick<typeof accounts.$inferSelect, "name" | "title">,
): string {
  return mentor.title ? `${mentor.name}, ${mentor.title}` : mentor.name;
}
