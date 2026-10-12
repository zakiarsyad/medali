import type { students } from "@/db/schema";

type Student = typeof students.$inferSelect;

/** How many putra and putri a list of students holds. */
export interface SexCounts {
  male: number;
  female: number;
}

export function sexCounts(listed: Pick<Student, "sex">[]): SexCounts {
  const male = listed.filter((student) => student.sex === "male").length;
  return { male, female: listed.length - male };
}
