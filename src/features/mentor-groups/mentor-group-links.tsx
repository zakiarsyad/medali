import Link from "next/link";
import { Fragment } from "react";
import shared from "@/ui/data-screen.module.css";
import { groupCode } from "@/ui/group-code";
import { groupAddress } from "./group-list-address";
import type { HeldGroup } from "./mentor-held-groups";

/** The codes of a mentor's groups, each a link to the page of that group. */
export function MentorGroupLinks({ groups }: { groups: HeldGroup[] }) {
  return groups.map((group, place) => (
    <Fragment key={group.id}>
      {place > 0 && ", "}
      <Link href={groupAddress(group.id)} className={shared.link}>
        {groupCode(group)}
      </Link>
    </Fragment>
  ));
}
