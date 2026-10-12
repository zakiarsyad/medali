/**
 * Whether an address is a campus one. `ending` is the campus ending as
 * the settings give it: in small letters, starting with "@", so a longer
 * ending or a name that only ends alike does not match. While it is
 * empty, no address is a campus one.
 */
export function isCampusEmail(email: string, ending: string): boolean {
  if (ending === "") return false;
  const hasName = email.length > ending.length;
  return hasName && email.toLowerCase().endsWith(ending);
}
