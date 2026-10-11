import type { SignedInAs } from "@/ui/menu-types";
import type { Account } from "./accounts";
import { ROLES } from "./roles";

export function accountLabel(account: Account): string {
  return account.title ? `${account.name}, ${account.title}` : account.name;
}

export function roleTitles(account: Account): string {
  return account.roles.map((role) => ROLES[role].title).join(", ");
}

export function signedInAs(account: Account): SignedInAs {
  const firstRole = account.roles[0];
  return {
    name: accountLabel(account),
    initials: firstRole ? ROLES[firstRole].initials : "?",
    roles: roleTitles(account),
  };
}
