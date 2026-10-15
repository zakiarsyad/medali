export interface MenuItem {
  path: string;
  title: string;
  /** How many items wait on the page for this account, shown beside its title. */
  count?: number;
}

/** The account shown under "Masuk sebagai". */
export interface SignedInAs {
  name: string;
  initials: string;
  roles: string;
  /** Whether "Ganti peran" is offered: only where sample accounts are. */
  maySwitch: boolean;
  /** Whether "Keluar" is offered: only to someone signed in with Google. */
  maySignOut: boolean;
}
