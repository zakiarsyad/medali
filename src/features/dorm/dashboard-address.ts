export const DASHBOARD_ADDRESS = "/asrama/dash";

/** The address of Dashboard asrama on a page of Kehadiran kegiatan. */
export function dashboardAddress(page: number): string {
  if (page <= 1) return DASHBOARD_ADDRESS;
  return `${DASHBOARD_ADDRESS}?hal=${page}`;
}
