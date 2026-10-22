import Link from "next/link";
import shared from "@/ui/data-screen.module.css";

/**
 * The student a list names: a link that opens their detail
 * over the list for an account that may open it, and the name alone
 * otherwise.
 */
export function StudentLink({
  name,
  address,
}: {
  name: string;
  /** The address that opens the detail, or null for no link. */
  address: string | null;
}) {
  if (address === null) return <b>{name}</b>;
  return (
    <Link href={address} scroll={false} className={shared.link}>
      {name}
    </Link>
  );
}
