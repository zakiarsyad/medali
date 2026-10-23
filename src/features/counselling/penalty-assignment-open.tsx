"use server";

import { forbidden } from "next/navigation";
import type { ReactNode } from "react";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { PenaltyAssignmentBox } from "./penalty-assignment-box";
import { PenaltyAssignmentPart } from "./penalty-assignment-part";
import { readPenaltyAssignmentOf } from "./penalty-assignments";

/**
 * The signed-in account when it may send a student to mandatory
 * counselling from a penalty. Any other is refused before anything of
 * what it sent is read.
 */
async function assigner(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "assign_counselling_from_penalty"))
    forbidden();
  return account;
}

/**
 * Mandatory counselling in "Rincian" of one penalty, read when it is
 * opened: the form, or how its Penugasan stands. Nothing for a penalty
 * not found among the account's rows.
 */
export async function openPenaltyAssignmentAction(
  penaltyId: string,
): Promise<ReactNode> {
  const actor = await assigner();
  const id = String(penaltyId);
  const opened = await readPenaltyAssignmentOf(database(), actor, id);
  if (opened === null) return null;
  const { name, assignment } = opened;
  const box = assignment ? (
    <PenaltyAssignmentBox assignment={assignment} />
  ) : null;
  return <PenaltyAssignmentPart penaltyId={id} name={name} box={box} />;
}
