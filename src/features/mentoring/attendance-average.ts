import type { AttendanceMark } from "@/mentoring/meeting-ids";

/**
 * The share of the meetings one member came to: hadir divided by hadir
 * plus alpa. Izin and Sakit are left out. Null for a member with no Hadir
 * and no Alpa, who has no share yet.
 */
export function attendanceShare(
  marks: readonly AttendanceMark[],
): number | null {
  let present = 0;
  let absent = 0;
  for (const mark of marks) {
    if (mark === "present") present += 1;
    if (mark === "absent") absent += 1;
  }
  const counted = present + absent;
  if (counted === 0) return null;
  return present / counted;
}

/**
 * "Rerata kehadiran pengasuhan" of a group as a whole percent: the
 * average of the members' own shares, over the members who have one.
 * Takes the marks of each member. Null while no member has a share.
 */
export function averageAttendance(
  marksOfMembers: readonly (readonly AttendanceMark[])[],
): number | null {
  let sum = 0;
  let counted = 0;
  for (const marks of marksOfMembers) {
    const share = attendanceShare(marks);
    if (share === null) continue;
    sum += share;
    counted += 1;
  }
  if (counted === 0) return null;
  return Math.round((sum / counted) * 100);
}

/** The average as its card shows it. */
export function shownAverage(average: number | null): string {
  return average === null ? "-" : `${average}%`;
}
