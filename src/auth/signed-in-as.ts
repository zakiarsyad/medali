import type { SignedInAs } from "@/ui/menu-types";
import type { Account } from "./accounts";
import type { SignedIn } from "./current-account";
import { ROLES } from "./roles";

export function accountLabel(account: Account): string {
  return account.title ? `${account.name}, ${account.title}` : account.name;
}

export function roleTitles(account: Account): string {
  return account.roles.map((role) => ROLES[role].title).join(", ");
}

/**
 * What the menu shows of the person using the app. "Keluar" is for
 * someone signed in with Google; "Ganti peran" is offered wherever it is
 * on, to them too.
 */
export function signedInAs(
  { account, way }: SignedIn,
  switcherOn: boolean,
): SignedInAs {
  const firstRole = account.roles[0];
  return {
    name: accountLabel(account),
    initials: firstRole ? ROLES[firstRole].initials : "?",
    roles: roleTitles(account),
    maySwitch: switcherOn,
    maySignOut: way === "google",
  };
}
