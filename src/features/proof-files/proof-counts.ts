import { type CountsByKind, noCounts } from "./proof-kinds";
import { isRemovable, type KeepingRule, type KeptProof } from "./removable";

/** The kept files of one kind that share a status, a day sent and a mark. */
export interface SentGroup extends KeptProof {
  /** Marked as removed while its file still waits to leave the storage. */
  isMarked: boolean;
  files: number;
}

export interface ProofCounts {
  kept: CountsByKind;
  removable: CountsByKind;
}

/**
 * How many files of each kind are kept and how many may be removed now.
 * A file marked as removed is no longer kept, and the next removal
 * finishes it.
 */
export function countProofs(
  groups: readonly SentGroup[],
  rule: KeepingRule,
): ProofCounts {
  const kept = noCounts();
  const removable = noCounts();
  for (const group of groups) {
    if (group.isMarked) {
      removable[group.kind] += group.files;
      continue;
    }
    kept[group.kind] += group.files;
    if (isRemovable(group, rule)) removable[group.kind] += group.files;
  }
  return { kept, removable };
}
