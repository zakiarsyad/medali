import Link from "next/link";
import shared from "@/ui/data-screen.module.css";
import { type SikuParams, sikuAddress } from "./siku-address";

/**
 * A student named in a list of Penilaian SIKU: a link that opens their
 * detail over the tab, and back to the same place on closing.
 */
export function StudentName({
  studentId,
  name,
  params,
}: {
  studentId: string;
  name: string;
  params: SikuParams;
}) {
  return (
    <Link
      href={sikuAddress({ ...params, detailId: studentId })}
      scroll={false}
      className={shared.link}
    >
      <b className={shared.typed}>{name}</b>
    </Link>
  );
}
