// Two test files that add a student with the same NIM at the same moment
// wait for each other, and the database stops one of them with "deadlock
// detected". So each test file keeps its own blocks of 100 sample NIMs.

/**
 * A sample NIM written in a test file, or the start of one that a test
 * puts together from parts or searches by. Longer numbers, such as a NIP,
 * are not NIMs.
 */
const SAMPLE_NIM = /(?<!\d)99\d{6,8}(?!\d)/g;

/** The first digits of a NIM, which name its block of 100 NIMs. */
const BLOCK_DIGITS = 8;

export interface TestFileText {
  path: string;
  text: string;
}

export interface SharedNimBlock {
  block: string;
  paths: string[];
}

export function nimBlocksIn(text: string): string[] {
  const nims = text.match(SAMPLE_NIM) ?? [];
  return [...new Set(nims.map((nim) => nim.slice(0, BLOCK_DIGITS)))];
}

function pathsByNimBlock(files: TestFileText[]): Map<string, string[]> {
  const pathsByBlock = new Map<string, string[]>();
  for (const file of files) {
    for (const block of nimBlocksIn(file.text)) {
      const paths = pathsByBlock.get(block) ?? [];
      pathsByBlock.set(block, [...paths, file.path]);
    }
  }
  return pathsByBlock;
}

export function sharedNimBlocks(files: TestFileText[]): SharedNimBlock[] {
  const shared: SharedNimBlock[] = [];
  for (const [block, paths] of pathsByNimBlock(files)) {
    if (paths.length > 1) shared.push({ block, paths });
  }
  return shared;
}
