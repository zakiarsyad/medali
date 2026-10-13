import type { AttendanceMark } from "@/mentoring/meeting-ids";

/** How many of the meetings that count one member came to. */
export interface AttendanceCount {
  /** The meetings marked Hadir. */
  present: number;
  /** The meetings marked Hadir or Alpa. Izin and Sakit are left out. */
  counted: number;
}

/** "Kehadiran pengasuhan" of one member, from the marks they have. */
export function attendanceCount(
  marks: readonly AttendanceMark[],
): AttendanceCount {
  let present = 0;
  let absent = 0;
  for (const mark of marks) {
    if (mark === "present") present += 1;
    if (mark === "absent") absent += 1;
  }
  return { present, counted: present + absent };
}

/** The count as a list shows it, such as 3/4, or a dash for none yet. */
export function shownAttendance(count: AttendanceCount): string {
  if (count.counted === 0) return "-";
  return `${count.present}/${count.counted}`;
}

/**
 * The share of the meetings one member came to: hadir divided by hadir
 * plus alpa. Izin and Sakit are left out. Null for a member with no Hadir
 * and no Alpa, who has no share yet.
 */
export function attendanceShare(
  marks: readonly AttendanceMark[],
): number | null {
  const { present, counted } = attendanceCount(marks);
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
