import Link from "next/link";
import shared from "./data-screen.module.css";

/**
 * A student named in a list: a link that opens their profile over the
 * tab, and back to the same place on closing. Whether the profile shows
 * whole, brief or not at all is the server's to decide when it opens.
 */
export function ProfileNameLink({
  name,
  href,
}: {
  name: string;
  href: string;
}) {
  return (
    <Link href={href} scroll={false} className={shared.link}>
      <b className={shared.typed}>{name}</b>
    </Link>
  );
}
