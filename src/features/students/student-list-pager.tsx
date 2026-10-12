import { ListPager } from "@/ui/list-pager";
import {
  type StudentListFilters,
  studentListAddress,
} from "./student-list-address";

/** Which rows the page shows, and the steps to the pages next to it. */
export function StudentListPager({
  filters,
  page,
  matching,
}: {
  filters: StudentListFilters;
  page: number;
  /** How many students match in all. */
  matching: number;
}) {
  return (
    <ListPager
      page={page}
      matching={matching}
      noun="mahasiswa"
      addressOf={(to) => studentListAddress(filters, to)}
    />
  );
}
