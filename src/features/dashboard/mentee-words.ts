import { groupCode } from "@/ui/group-code";
import type { MenteeContent } from "./mentee-recap";

/** What Dashboard anak asuh says, alone, to a Pengasuh who holds no group. */
export const NO_GROUP_HELD =
  "Anda belum memegang kelompok pengasuhan. Data akan tampil setelah Kepala Unit menugaskan kelompok kepada Anda.";

function shown(amount: number): string {
  return amount.toLocaleString("id-ID");
}

/** The line under the title: how many anak asuh, in which groups and angkatan. */
export function menteeLede(
  content: Pick<MenteeContent, "students" | "groups">,
): string {
  const codes = content.groups.map(groupCode);
  const years = [...new Set(content.groups.map((group) => group.cohortYear))];
  return `Empat aspek penilaian ${shown(content.students)} anak asuh Anda di ${codes.join(", ")}, angkatan ${years.join(", ")}.`;
}
