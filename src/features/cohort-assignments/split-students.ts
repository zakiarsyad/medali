import type { students } from "@/db/schema";
import type { AssignmentMethod } from "./methods";

type Student = typeof students.$inferSelect;

/** What the three methods read of a student. */
export type SplitStudent = Pick<
  Student,
  "nim" | "sex" | "province" | "className"
>;

type Compare = (a: SplitStudent, b: SplitStudent) => number;

const SEX_PLACE: Record<Student["sex"], number> = { male: 0, female: 1 };

function compareText(a: string | null, b: string | null): number {
  return (a ?? "").localeCompare(b ?? "");
}

const byNim: Compare = (a, b) => compareText(a.nim, b.nim);

const byClassThenNim: Compare = (a, b) => {
  const classes = compareText(a.className, b.className);
  if (classes !== 0) return classes;
  return byNim(a, b);
};

const bySexThenProvinceThenNim: Compare = (a, b) => {
  if (a.sex !== b.sex) return SEX_PLACE[a.sex] - SEX_PLACE[b.sex];
  const provinces = compareText(a.province, b.province);
  if (provinces !== 0) return provinces;
  return byNim(a, b);
};

function emptyGroups<S>(count: number): S[][] {
  return Array.from({ length: count }, () => []);
}

/**
 * Deals a sorted list out like cards, one to each group, and turns round
 * at the end of every row: the first row goes from the first group to the
 * last and the next comes back. Students who stand next to each other in
 * the list, alike in what it was sorted by, land in different groups.
 */
function dealInSnake<S>(sorted: S[], count: number): S[][] {
  const groups = emptyGroups<S>(count);
  for (const [place, student] of sorted.entries()) {
    const row = Math.floor(place / count);
    const column = place % count;
    const comesBack = row % 2 === 1;
    const group = comesBack ? count - 1 - column : column;
    groups[group]?.push(student);
  }
  return groups;
}

/** Cuts a sorted list into runs of students who follow each other. */
function cutInRuns<S>(sorted: S[], count: number): S[][] {
  const groups = emptyGroups<S>(count);
  for (const [place, student] of sorted.entries()) {
    const group = Math.floor((place * count) / sorted.length);
    groups[group]?.push(student);
  }
  return groups;
}

/**
 * Splits the students of one program studi and jalur into this many
 * groups by a method. "Seimbang" sorts by jenis kelamin (putra first),
 * provinsi and NIM, and deals them out so each group gets its share of
 * each. "Urut NIM" and "Mengikuti kelas akademik" sort by NIM, or by kelas
 * and then NIM, and keep students who follow each other together.
 */
export function splitStudents<S extends SplitStudent>(
  students: S[],
  count: number,
  method: AssignmentMethod,
): S[][] {
  if (count <= 0) return [];
  if (method === "balanced") {
    return dealInSnake([...students].sort(bySexThenProvinceThenNim), count);
  }
  const order = method === "by_class" ? byClassThenNim : byNim;
  return cutInRuns([...students].sort(order), count);
}
