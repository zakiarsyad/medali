/** The address of Pengaturan > Periode akademik. */
export const PERIODS_ADDRESS = "/pengaturan/periode";

/** The name in the address that opens the closing step of a period. */
export const CLOSE_STEP_PARAM = "tutup";

/** The address of the page with the closing step of one period open. */
export function closeStepAddress(periodId: string): string {
  const params = new URLSearchParams({ [CLOSE_STEP_PARAM]: periodId });
  return `${PERIODS_ADDRESS}?${params}`;
}
