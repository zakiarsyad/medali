/** What follows the number of students under the filter. */
export function foundWords(filtersInUse: number): string {
  if (filtersInUse === 0) return "mahasiswa aktif";
  return `mahasiswa sesuai ${filtersInUse} filter`;
}
