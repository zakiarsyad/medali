import Link from "next/link";
import shared from "@/ui/data-screen.module.css";
import { TabNote } from "@/ui/tabbed-head";

/** Says where new mentors are added, with the way there. */
export function NewMentorsNote({ usersAddress }: { usersAddress: string }) {
  return (
    <TabNote>
      Pengasuh baru ditambahkan di Pengaturan &gt;{" "}
      <Link href={usersAddress} className={shared.link}>
        Pengguna dan peran
      </Link>
      .
    </TabNote>
  );
}
