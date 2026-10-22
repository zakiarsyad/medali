/** The address of Pengaturan > Periode akademik. */
export const PERIODS_ADDRESS = "/pengaturan/periode";

/** The name in the address that opens the closing step of a period. */
export const CLOSE_STEP_PARAM = "tutup";

/** The name in the address that says which period was just closed. */
export const CLOSED_PARAM = "ditutup";

function addressWith(name: string, periodId: string): string {
  const params = new URLSearchParams({ [name]: periodId });
  return `${PERIODS_ADDRESS}?${params}`;
}

/** The address of the page with the closing step of one period open. */
export function closeStepAddress(periodId: string): string {
  return addressWith(CLOSE_STEP_PARAM, periodId);
}

/** The address of the page once a period is closed, which says so. */
export function closedAddress(periodId: string): string {
  return addressWith(CLOSED_PARAM, periodId);
}
