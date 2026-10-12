import { DORM_NAMES } from "@/dorms/dorms";
import { roomHeader } from "@/dorms/student-room";
import type { StudentResidence } from "./student-residence";

/** The Asrama line of a student's detail. */
export function residenceWords(residence: StudentResidence | null): string {
  if (residence === null) return "Non asrama";
  const { dorm, room } = residence;
  if (room === null) return DORM_NAMES[dorm];
  if (!room.plotted) return `${DORM_NAMES[dorm]} · Belum diplot`;
  return roomHeader(dorm, room);
}
