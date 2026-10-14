import Link from "next/link";
import shared from "@/ui/data-screen.module.css";
import { cohortAddress } from "./assignment-address";

/**
 * "Anggota" in the row of a group: opens the members of the group under
 * its row, and reads "Tutup" while they are open.
 */
export function MembersLink({
  cohortYear,
  groupId,
  isOpen,
}: {
  cohortYear: number;
  groupId: string;
  isOpen: boolean;
}) {
  const address = cohortAddress(cohortYear, isOpen ? null : groupId);
  return (
    <Link href={address} scroll={false} className={shared.link}>
      {isOpen ? "Tutup" : "Anggota"}
    </Link>
  );
}
