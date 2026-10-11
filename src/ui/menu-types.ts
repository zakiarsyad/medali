export interface MenuItem {
  path: string;
  title: string;
}

/** The account shown under "Masuk sebagai". */
export interface SignedInAs {
  name: string;
  initials: string;
  roles: string;
}
