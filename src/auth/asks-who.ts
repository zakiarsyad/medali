/**
 * Reads the code of a screen, of an address the server answers itself
 * and of a file of actions, and says whether it asks who is using the
 * app before anything else. The code is read as text, in the layout the
 * formatter gives it. Whatever cannot be read counts as not asking, so
 * a new shape fails the check and is never passed by mistake.
 */

const NOTES = /\/\*[\s\S]*?\*\/|\/\/.*$/gm;
const TOP_LEVEL_FUNCTION =
  /^(export )?(default )?(?:async )?function (\w+)\([\s\S]*?^\}$/gm;
const EXPORTED_FUNCTION = /^export (?:default )?(?:async )?function (\w+)\(/gm;
const SIGNATURE_END = /^\S.*\{$/;
// Also an export that does not start its line, as one after a note does:
// it is found here and read nowhere, so it counts as unreadable.
const EXPORT = /^[ \t]*export\b.*$/gm;
/** A function, a type, or a plain value such as a text or a number. */
const READABLE_EXPORT =
  /^export (?:(?:default )?(?:async )?function \w+\(|interface |type |const \w+ = (?:"[^"]*"|\d+|true|false);$)/;
const DIRECTIVE = /^\s*["']use server["'];?\s*$/;
const READS_OWN_ADDRESS =
  /^const (?:\w+|\{[^}]*\}) = await (?:props|context)\.(?:params|searchParams);$/;
const OPENS_PAGE =
  /^(?:const (?:\w+|\{[^}]*\}) = )?await (openPage\([^()]*\));$/;
const ASKS_ACCOUNT = /^const \w+ = await currentAccount\(\);$/;
const ASKS_FIRST = /^(?:const \w+ = )?await (\w+)\(\);$/;
const ASKS_AND_REFUSES =
  /^const account = await currentAccount\(\); if \(!account \|\| !may\(account\.roles, "\w+"\)\) forbidden\(\); return account;$/;
const GROUP_FOLDER = /\([^/]+\)\//g;

interface TopLevelFunction {
  name: string;
  isExported: boolean;
  isDefault: boolean;
  /** The lines inside the function, without notes and empty lines. */
  body: string[];
}

function withoutNotes(source: string): string {
  return source.replace(NOTES, "");
}

function codeLines(source: string): string[] {
  return withoutNotes(source)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
}

function bodyOf(functionText: string): string[] {
  const lines = functionText.split("\n");
  const signatureEnd = lines.findIndex((line) => SIGNATURE_END.test(line));
  return codeLines(lines.slice(signatureEnd + 1, -1).join("\n"));
}

function topLevelFunctions(source: string): TopLevelFunction[] {
  const found: TopLevelFunction[] = [];
  for (const match of withoutNotes(source).matchAll(TOP_LEVEL_FUNCTION)) {
    found.push({
      name: match[3] ?? "",
      isExported: match[1] !== undefined,
      isDefault: match[2] !== undefined,
      body: bodyOf(match[0]),
    });
  }
  return found;
}

/** The lines inside one function of a file, without notes. */
export function linesOf(source: string, functionName: string): string[] {
  const named = topLevelFunctions(source).find(
    (each) => each.name === functionName,
  );
  return named?.body ?? [];
}

/** The functions a file hands out, by name. */
export function exportedFunctionNames(source: string): string[] {
  const names: string[] = [];
  for (const match of withoutNotes(source).matchAll(EXPORTED_FUNCTION)) {
    if (match[1]) names.push(match[1]);
  }
  return names;
}

/**
 * Whether a file takes a thing from the file that defines it, under its
 * own name, and from nowhere else.
 */
function takes(source: string, name: string, from: string): boolean {
  const imports = new RegExp(
    `import \\{[^}]*\\b${name}\\b[^}]*\\} from "([^"]+)";`,
    "g",
  );
  const renamed = new RegExp(`\\b${name} as\\b|\\bas ${name}\\b`);
  const found = [...withoutNotes(source).matchAll(imports)];
  const [only] = found;
  if (found.length !== 1 || only === undefined) return false;
  return only[1] === from && !renamed.test(only[0]);
}

/**
 * The exported functions of a file whose first line does not ask. Its
 * own address is all a function may read before that line.
 */
function exportedNotAsking(
  source: string,
  asks: (firstLine: string) => boolean,
): string[] {
  const asking = topLevelFunctions(source)
    .filter((each) => each.isExported)
    .filter((each) => {
      const first = each.body.find((line) => !READS_OWN_ADDRESS.test(line));
      return asks(first ?? "");
    })
    .map((each) => each.name);
  return exportedFunctionNames(source).filter((name) => !asking.includes(name));
}

/**
 * What a file hands out in a shape that cannot be read here, such as a
 * function kept in a value.
 */
export function unreadableExports(source: string): string[] {
  const exports = withoutNotes(source).match(EXPORT) ?? [];
  return exports.filter((line) => !READABLE_EXPORT.test(line));
}

/** The address of a screen file: "asrama/kakak", or "[page]/[tab]". */
export function addressOfScreen(path: string): string {
  return path
    .replace(/^src\/app\//, "")
    .replace(GROUP_FOLDER, "")
    .replace(/\/?page\.tsx$/, "");
}

/** The call that opens the page at an address, such as "asrama/kakak". */
function callThatOpens(address: string): string {
  const parts = address.split("/").map((part) => `"${part}"`);
  return `openPage(${parts.join(", ")})`;
}

/**
 * What is wrong with the screen at an address, or null. A screen goes
 * through `openPage`, the one place that checks the account and the
 * page, before it reads anything but its own address. A screen at a
 * fixed address opens the page of that address and no other; one that
 * takes its page from the address, such as "[page]/[tab]", opens what
 * it was given.
 */
export function screenFault(source: string, address: string): string | null {
  if (!takes(source, "openPage", "@/auth/open-page")) {
    return "does not go through openPage, which checks the account and the page";
  }
  if (!topLevelFunctions(source).some((each) => each.isDefault)) {
    return "holds no screen that can be read here";
  }
  const takesPageFromAddress = address.includes("[");
  const notAsking = exportedNotAsking(source, (firstLine) => {
    const opened = OPENS_PAGE.exec(firstLine)?.[1];
    if (opened === undefined) return false;
    return takesPageFromAddress || opened === callThatOpens(address);
  });
  if (notAsking.length > 0) {
    return `${notAsking.join(", ")} does not start with openPage for its own address, which checks the account and the page`;
  }
  return null;
}

/**
 * What is wrong with an address the server answers itself, or null.
 * Each of its answers asks for the current account before it reads
 * anything but its own address.
 */
export function answerFault(source: string): string | null {
  if (!takes(source, "currentAccount", "@/auth/current-account")) {
    return "does not ask currentAccount who is using it";
  }
  if (exportedFunctionNames(source).length === 0) {
    return "holds no answer that can be read here";
  }
  const notAsking = exportedNotAsking(source, (firstLine) =>
    ASKS_ACCOUNT.test(firstLine),
  );
  if (notAsking.length > 0) {
    return `${notAsking.join(", ")} does not start by asking who is using it`;
  }
  return null;
}

/** Whether a whole file holds actions the browser may call. */
export function isActionFile(source: string): boolean {
  return DIRECTIVE.test(codeLines(source)[0] ?? "");
}

/** Whether an action is written inside a function, where it is not read. */
export function holdsActionInside(source: string): boolean {
  const [, ...rest] = withoutNotes(source)
    .split("\n")
    .filter((line) => line.trim() !== "");
  return rest.some((line) => DIRECTIVE.test(line));
}

function asOneLine(lines: string[]): string {
  return lines.join(" ").replace(/\( /g, "(").replace(/,? \)/g, ")");
}

function takesTheCheckOfActions(source: string): boolean {
  return (
    takes(source, "currentAccount", "@/auth/current-account") &&
    takes(source, "may", "@/auth/access") &&
    takes(source, "forbidden", "next/navigation")
  );
}

/**
 * The functions of a file that only ask whether the current account may
 * do a named action, and refuse when nobody is signed in or the account
 * may not.
 */
function functionsThatAskAndRefuse(source: string): string[] {
  if (!takesTheCheckOfActions(source)) return [];
  return topLevelFunctions(source)
    .filter((each) => !each.isExported)
    .filter((each) => ASKS_AND_REFUSES.test(asOneLine(each.body)))
    .map((each) => each.name);
}

/**
 * The actions of a file that do not ask, as the first thing they do,
 * whether the account may do it.
 */
export function actionsNotAsking(source: string): string[] {
  const askAndRefuse = functionsThatAskAndRefuse(source);
  const asking = topLevelFunctions(source)
    .filter((each) => each.isExported)
    .filter((each) => {
      const asked = ASKS_FIRST.exec(each.body[0] ?? "")?.[1];
      return asked !== undefined && askAndRefuse.includes(asked);
    })
    .map((each) => each.name);
  return exportedFunctionNames(source).filter((name) => !asking.includes(name));
}
