import Link from "next/link";
import shared from "@/ui/data-screen.module.css";
import styles from "./mentor-groups.module.css";

/** Says where new mentors are added, with the way there. */
export function NewMentorsNote({ usersAddress }: { usersAddress: string }) {
  return (
    <p className={styles.note}>
      Pengasuh baru ditambahkan di Pengaturan &gt;{" "}
      <Link href={usersAddress} className={shared.link}>
        Pengguna dan peran
      </Link>
      .
    </p>
  );
}
