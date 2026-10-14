/*
 * Read by the screen parts in the browser, so nothing here may take from
 * the database code.
 */

export const CLARIFICATIONS_ADDRESS = "/asrama/klar";

/**
 * Where the file of a dorm clarification is asked from the server: to be
 * shown inside the page, or to be downloaded.
 */
export function clarificationFileAddress(
  clarificationId: string,
  isShown: boolean,
): string {
  const address = `${CLARIFICATIONS_ADDRESS}/lampiran/${clarificationId}`;
  return isShown ? `${address}?lihat=1` : address;
}
