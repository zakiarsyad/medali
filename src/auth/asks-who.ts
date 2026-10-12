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
const EXPORT = /^export .*$/gm;
/** A function, a type, or a plain value such as a text or a number. */
const READABLE_EXPORT =
  /^export (?:(?:default )?(?:async )?function \w+\(|interface |type |const \w+ = (?:"[^"]*"|\d+|true|false);$)/;
const DIRECTIVE = /^\s*["']use server["'];?\s*$/;
const ADDRESS_READ = /await (?:props|context)\.(?:params|searchParams)\b/g;
const ASKS_FIRST = /^(?:const \w+ = )?await (\w+)\(\);$/;
const ASKS_AND_REFUSES =
  /^const account = await currentAccount\(\); if \(!account \|\| !may\(account\.roles, "\w+"\)\) forbidden\(\); return account;$/;

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

/** The functions a file hands out, by name. */
export function exportedFunctionNames(source: string): string[] {
  const names: string[] = [];
  for (const match of withoutNotes(source).matchAll(EXPORTED_FUNCTION)) {
    if (match[1]) names.push(match[1]);
  }
  return names;
}

/** Whether a file takes a thing from the file that defines it. */
function takes(source: string, name: string, from: string): boolean {
  const imports = new RegExp(
    `import \\{[^}]*(?<!\\bas )\\b${name}\\b[^}]*\\} from "${from}";`,
  );
  return imports.test(withoutNotes(source));
}

/**
 * Whether the first thing a function waits for is the given call. Its
 * own address is all it may read before that.
 */
function waitsFirstFor(body: string[], call: string): boolean {
  const firstWait = body
    .map((line) => line.replace(ADDRESS_READ, ""))
    .find((line) => line.includes("await "));
  return firstWait?.includes(`await ${call}`) ?? false;
}

/** The exported functions of a file that do not start with the call. */
function notStartingWith(source: string, call: string): string[] {
  const read = topLevelFunctions(source).filter((each) => each.isExported);
  const asking = read
    .filter((each) => waitsFirstFor(each.body, call))
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

/**
 * What is wrong with a screen, or null. A screen goes through
 * `openPage`, the one place that checks the account and the page,
 * before it reads anything but its own address.
 */
export function screenFault(source: string): string | null {
  if (!takes(source, "openPage", "@/auth/open-page")) {
    return "does not go through openPage, which checks the account and the page";
  }
  if (!topLevelFunctions(source).some((each) => each.isDefault)) {
    return "holds no screen that can be read here";
  }
  const notAsking = notStartingWith(source, "openPage(");
  if (notAsking.length > 0) {
    return `${notAsking.join(", ")} reads something before openPage has checked the account and the page`;
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
  const notAsking = notStartingWith(source, "currentAccount()");
  if (notAsking.length > 0) {
    return `${notAsking.join(", ")} reads something before it asks who is using it`;
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
