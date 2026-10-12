/**
 * What a group's row says of its mentors, from how many mentor lines the
 * group has had: every line after the first is one replacement.
 */
export function historyWords(mentorLines: number): string {
  if (mentorLines <= 1) return "Pengasuh awal";
  return `${mentorLines - 1} kali diganti`;
}
