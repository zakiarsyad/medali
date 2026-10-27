import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sourceFilesEndingWith } from "@/ui/source-files";
import {
  actionsNotAsking,
  addressOfScreen,
  answerFault,
  exportedFunctionNames,
  holdsActionInside,
  holdsCodeLostInANote,
  isActionFile,
  linesOf,
  screenFault,
  unreadableExports,
} from "./asks-who";

/**
 * Everything that works without a sign-in, with the reason. A file of
 * the screens is named by its path, an action by its file and its name.
 */
const NEEDS_NO_SIGN_IN: Record<string, string> = {
  "src/app/masuk/page.tsx":
    "The sign-in page: someone who is not signed in must reach it.",
  "src/auth/start-google-sign-in.ts startGoogleSignIn":
    'The start of "Masuk dengan Google": pressed by someone not signed in yet.',
  "src/app/masuk/google/kembali/route.ts":
    "Where Google sends a person back to: the sign-in is not finished yet.",
  "src/app/keluar/route.ts":
    '"Keluar": it only ends a sign-in, and must also work once that has ended.',
  "src/app/not-found.tsx":
    '"Halaman tidak ditemukan" outside the menu: it shows no data.',
  "src/app/(app)/not-found.tsx":
    '"Halaman tidak ditemukan" inside the menu: it shows no data.',
  "src/app/(app)/error.tsx":
    '"Halaman tidak dapat ditampilkan" inside the menu: it shows no data, not even what the fault says.',
  "src/app/global-error.tsx":
    '"Halaman tidak dapat ditampilkan" on a page of its own: it shows no data, not even what the fault says.',
  "src/app/(app)/forbidden.tsx":
    '"Akses ditolak": it shows no data, and offers the sign-in page to someone whose sign-in has ended.',
  "src/app/(app)/ganti-peran/page.tsx":
    '"Ganti peran": it is how an account is picked where it is on, and is not found where it is off.',
  "src/auth/switch-account.ts switchAccount":
    'The pick on "Ganti peran": refused where "Ganti peran" is off.',
  "src/app/(app)/page.tsx":
    "The first address: no page of the list, it only sends each account on to its first page, or to the sign-in page.",
  "src/app/layout.tsx":
    "The frame around the whole app, also around the sign-in page: it shows no data.",
  "src/app/(app)/layout.tsx":
    "The frame with the menu, part of every screen: it shows the menu to a signed-in account and nothing to anyone else.",
};

function needsNoSignIn(name: string): boolean {
  return name in NEEDS_NO_SIGN_IN;
}

function read(path: string): string {
  return readFileSync(path, "utf8");
}

const TEST_FILE = /\.test\.tsx?$/;

function sourceFiles(): string[] {
  return [...sourceFilesEndingWith(".ts"), ...sourceFilesEndingWith(".tsx")]
    .filter((path) => !TEST_FILE.test(path))
    .sort();
}

const appFiles = sourceFiles().filter((path) => path.startsWith("src/app/"));
const screens = appFiles.filter((path) => path.endsWith("/page.tsx"));
const answers = appFiles.filter((path) => path.endsWith("/route.ts"));
const otherAppFiles = appFiles.filter(
  (path) => !screens.includes(path) && !answers.includes(path),
);
const actionFiles = sourceFiles().filter((path) => isActionFile(read(path)));

const MADE_UP_SCREEN_THAT_ASKS = `
import { openPage } from "@/auth/open-page";
import { RowsScreen } from "@/features/rows/rows-screen";

export default async function RowsPage(props: PageProps<"/[page]/[tab]">) {
  const { page, tab } = await props.params;
  const opened = await openPage(page, tab);
  return <RowsScreen account={opened.account} />;
}
`;

const MADE_UP_SCREEN_THAT_DOES_NOT_ASK = `
import { database } from "@/db/database";
import { readRows } from "@/features/rows/read-rows";
import { RowsScreen } from "@/features/rows/rows-screen";

export default async function RowsPage() {
  return <RowsScreen rows={await readRows(database())} />;
}
`;

const MADE_UP_SCREEN_THAT_ASKS_TOO_LATE = `
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { readRows } from "@/features/rows/read-rows";
import { RowsScreen } from "@/features/rows/rows-screen";

export default async function RowsPage() {
  const rows = await readRows(database());
  await openPage("baris");
  return <RowsScreen rows={rows} />;
}
`;

const MADE_UP_SCREEN_WITH_ITS_OWN_GATE = `
import { database } from "@/db/database";
import { readRows } from "@/features/rows/read-rows";
import { openPage } from "@/features/rows/open-page";

export default async function RowsPage() {
  await openPage("baris");
  return <RowsScreen rows={await readRows(database())} />;
}
`;

const MADE_UP_SCREEN_WITH_A_TITLE_THAT_DOES_NOT_ASK = `
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { readRowName } from "@/features/rows/read-rows";

export async function generateMetadata() {
  return { title: await readRowName(database()) };
}

export default async function RowsPage() {
  await openPage("baris");
  return <RowsScreen />;
}
`;

const MADE_UP_SCREEN_THAT_ASKS_ONLY_SOMETIMES = `
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { readRows } from "@/features/rows/read-rows";

export default async function RowsPage(props: PageProps<"/[page]">) {
  const { page } = await props.params;
  if (page !== "publik") await openPage(page);
  return <RowsScreen rows={await readRows(database())} />;
}
`;

const MADE_UP_SCREEN_AT_A_FIXED_ADDRESS = `
import { openPage } from "@/auth/open-page";

export default async function RowsPage() {
  const opened = await openPage("pengaturan", "baris");
  return <RowsScreen account={opened.account} />;
}
`;

const MADE_UP_SCREEN_WITH_OPEN_PAGE_RENAMED = `
import { openPage as checked } from "@/auth/open-page";
import { openPage } from "@/features/rows/open-page";

export default async function RowsPage() {
  await openPage("baris");
  return <RowsScreen />;
}
`;

const MADE_UP_SCREEN_WITH_A_TITLE_AFTER_A_NOTE = `
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { readRowName } from "@/features/rows/read-rows";

/* the title */ export async function generateMetadata() {
  return { title: await readRowName(database()) };
}

export default async function RowsPage() {
  await openPage("baris");
  return <RowsScreen />;
}
`;

describe("screenFault", () => {
  it("finds nothing in a screen that goes through openPage first", () => {
    expect(screenFault(MADE_UP_SCREEN_THAT_ASKS, "[page]/[tab]")).toBeNull();
  });

  it.each([
    ["that does not ask", MADE_UP_SCREEN_THAT_DOES_NOT_ASK],
    ["that reads before it asks", MADE_UP_SCREEN_THAT_ASKS_TOO_LATE],
    ["that asks a place of its own", MADE_UP_SCREEN_WITH_ITS_OWN_GATE],
    ["whose title does not ask", MADE_UP_SCREEN_WITH_A_TITLE_THAT_DOES_NOT_ASK],
    [
      "that takes openPage under another name",
      MADE_UP_SCREEN_WITH_OPEN_PAGE_RENAMED,
    ],
  ])("finds a made-up screen %s", (_kind, source) => {
    expect(screenFault(source, "baris")).not.toBeNull();
  });

  it("finds a made-up screen that asks only sometimes", () => {
    const source = MADE_UP_SCREEN_THAT_ASKS_ONLY_SOMETIMES;
    expect(screenFault(source, "[page]")).not.toBeNull();
  });

  it("finds a made-up screen that opens the page of another address", () => {
    const source = MADE_UP_SCREEN_AT_A_FIXED_ADDRESS;
    expect(screenFault(source, "pengaturan/baris")).toBeNull();
    expect(screenFault(source, "pengaturan/pengguna")).not.toBeNull();
    expect(screenFault(source, "pengaturan/[tab]")).not.toBeNull();
    expect(screenFault(source, "[page]/[tab]")).not.toBeNull();
  });

  it("finds a made-up screen that opens a page without its tab", () => {
    const source = MADE_UP_SCREEN_AT_A_FIXED_ADDRESS.replace(', "baris"', "");
    expect(screenFault(source, "pengaturan")).toBeNull();
    expect(screenFault(source, "pengaturan/baris")).not.toBeNull();
  });

  it("still reads what follows a text that looks like the start of a note", () => {
    const source = `
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { readRowName } from "@/features/rows/read-rows";

export default async function RowsPage() {
  await openPage("baris");
  return <input accept="image/*" />;
}

export async function generateMetadata() {
  return { title: await readRowName(database()) };
}

/** The name shown above the rows. */
function heading() {
  return "Baris";
}
`;
    expect(screenFault(source, "baris")).toContain("generateMetadata");
    expect(holdsCodeLostInANote(source)).toBe(false);
  });

  it("takes an export after a note as one it cannot read", () => {
    const source = MADE_UP_SCREEN_WITH_A_TITLE_AFTER_A_NOTE;
    expect(unreadableExports(source)).toHaveLength(1);
  });
});

describe("holdsCodeLostInANote", () => {
  it("finds code after a text that reads as the start of a note", () => {
    const source = `
export default async function RowsPage() {
  await openPage("baris");
  const hint = "pisahkan dengan /* atau";
  async function save() {
    "use server";
    await saveRows(database());
  }
  return <form action={save} title={hint} />;
}

/** The name shown above the rows. */
function heading() {
  return "Baris";
}
`;
    expect(holdsCodeLostInANote(source)).toBe(true);
  });

  it("finds none in real notes", () => {
    const source = `
/**
 * The rows of a page. Its upload takes "image/*" only.
 */
export default async function RowsPage() {
  const opened = await openPage("baris"); /* checked first */
  return (
    <>
      {/* A plain link,
          so the page loads anew. */}
      <a href="/baris">Baris</a>
    </>
  );
}
`;
    expect(holdsCodeLostInANote(source)).toBe(false);
  });

  it("finds code after a text that starts its own line", () => {
    const source = `
export default async function RowsPage() {
  await openPage("baris");
  return (
    <p>
      /* atau garis miring
    </p>
  );
}

export async function generateMetadata() {
  return { title: await readRowName(database()) };
}

/** The name shown above the rows. */
function heading() {
  return "Baris";
}
`;
    expect(holdsCodeLostInANote(source)).toBe(true);
  });

  it("finds code lost up to a sign that ends no real note", () => {
    const source = `
export default async function RowsPage() {
  await openPage("baris");
  return <p title="Berkas /* gambar">Baris</p>;
}

export async function generateMetadata() {
  return { title: await readRowName(database()) };
}

// The browser sends "*/*" when it takes anything.
`;
    expect(holdsCodeLostInANote(source)).toBe(true);
  });
});

describe("addressOfScreen", () => {
  it("leaves out the folders that only group screens", () => {
    expect(addressOfScreen("src/app/(app)/asrama/kakak/page.tsx")).toBe(
      "asrama/kakak",
    );
    expect(addressOfScreen("src/app/(app)/[page]/page.tsx")).toBe("[page]");
  });
});

const MADE_UP_ANSWER_THAT_ASKS = `
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { openRowFile } from "@/features/rows/open-row-file";

export async function GET(
  _request: Request,
  context: RouteContext<"/baris/berkas/[id]">,
): Promise<Response> {
  const { id } = await context.params;
  const account = await currentAccount();
  return openRowFile(database(), account, id);
}
`;

const MADE_UP_ANSWER_THAT_DOES_NOT_ASK = `
import { database } from "@/db/database";
import { openRowFile } from "@/features/rows/open-row-file";

export async function GET(
  _request: Request,
  context: RouteContext<"/baris/berkas/[id]">,
): Promise<Response> {
  const { id } = await context.params;
  return openRowFile(database(), id);
}
`;

const MADE_UP_ANSWER_WITH_ONE_THAT_DOES_NOT_ASK = `${MADE_UP_ANSWER_THAT_ASKS}
export async function DELETE(): Promise<Response> {
  await removeRowFiles(database());
  return new Response(null);
}
`;

describe("answerFault", () => {
  it("finds nothing in an address that asks who is using it first", () => {
    expect(answerFault(MADE_UP_ANSWER_THAT_ASKS)).toBeNull();
  });

  it("finds a made-up address that does not ask", () => {
    expect(answerFault(MADE_UP_ANSWER_THAT_DOES_NOT_ASK)).not.toBeNull();
  });

  it("names the answer that does not ask, beside one that does", () => {
    expect(answerFault(MADE_UP_ANSWER_WITH_ONE_THAT_DOES_NOT_ASK)).toContain(
      "DELETE",
    );
  });
});

const MADE_UP_ACTIONS = `
"use server";

import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { addRow, removeRow, renameRow } from "@/features/rows/change-rows";

async function rowManager(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "manage_rows")) forbidden();
  return account;
}

async function anyAccount(): Promise<Account | null> {
  return currentAccount();
}

export async function addRowAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const manager = await rowManager();
  return addRow(database(), manager, form);
}

export async function removeRowAction(id: string): Promise<FormState> {
  return removeRow(database(), id);
}

export async function renameRowAction(form: FormData): Promise<FormState> {
  const renamed = await renameRow(database(), form);
  await rowManager();
  return renamed;
}

export async function signedInOnlyAction(id: string): Promise<FormState> {
  const account = await anyAccount();
  return removeRow(database(), account, id);
}
`;

describe("actionsNotAsking", () => {
  it("finds the made-up actions that do not ask whether the account may", () => {
    expect(actionsNotAsking(MADE_UP_ACTIONS)).toEqual([
      "removeRowAction",
      "renameRowAction",
      "signedInOnlyAction",
    ]);
  });

  it("finds every action of a file that asks a check of its own", () => {
    const source = MADE_UP_ACTIONS.replace("@/auth/access", "./access");
    expect(actionsNotAsking(source)).toContain("addRowAction");
  });

  it("reads a check that the formatter broke over several lines", () => {
    const source = MADE_UP_ACTIONS.replace(
      'if (!account || !may(account.roles, "manage_rows")) forbidden();',
      `if (
    !account ||
    !may(account.roles, "manage_rows_of_a_very_long_name")
  )
    forbidden();`,
    );
    expect(actionsNotAsking(source)).not.toContain("addRowAction");
  });
});

describe("unreadableExports", () => {
  it("reads a function, a type and a plain value", () => {
    const source = `
export const dynamic = "force-dynamic";
export interface Shown {
  message: string;
}
export async function addRowAction(): Promise<void> {
  await rowManager();
}
`;
    expect(unreadableExports(source)).toEqual([]);
  });

  it("finds a made-up action kept in a value", () => {
    const source = "export const removeRowAction = async (id: string) => {";
    expect(unreadableExports(source)).toEqual([source]);
  });
});

describe("holdsActionInside", () => {
  it("finds a made-up action written inside a screen", () => {
    const source = `
export default async function RowsPage() {
  async function removeRow() {
    "use server";
    await removeRows(database());
  }
  return <form action={removeRow} />;
}
`;
    expect(holdsActionInside(source)).toBe(true);
    expect(isActionFile(source)).toBe(false);
  });

  it("finds none in a file of actions", () => {
    expect(holdsActionInside(MADE_UP_ACTIONS)).toBe(false);
    expect(isActionFile(MADE_UP_ACTIONS)).toBe(true);
  });
});

describe("every screen", () => {
  it("finds the screens", () => {
    expect(screens).toContain("src/app/(app)/kurikulum/page.tsx");
    expect(screens).toContain("src/app/(app)/[page]/[tab]/page.tsx");
  });

  it.each(screens.filter((path) => !needsNoSignIn(path)))(
    "%s goes through the place that checks the account and the page",
    (path) => {
      expect(screenFault(read(path), addressOfScreen(path))).toBeNull();
      expect(unreadableExports(read(path))).toEqual([]);
    },
  );
});

describe("every address the server answers itself", () => {
  it("finds the download of a kept student file", () => {
    expect(answers).toContain(
      "src/app/(app)/pengaturan/mahasiswa/berkas/[id]/route.ts",
    );
  });

  it.each(answers.filter((path) => !needsNoSignIn(path)))(
    "%s asks who is using it",
    (path) => {
      expect(answerFault(read(path))).toBeNull();
      expect(unreadableExports(read(path))).toEqual([]);
    },
  );
});

describe("every other file among the screens", () => {
  it("finds the frame with the menu", () => {
    expect(otherAppFiles).toContain("src/app/(app)/layout.tsx");
  });

  it.each(otherAppFiles)("%s is named as needing no sign-in", (path) => {
    expect(needsNoSignIn(path)).toBe(true);
  });
});

describe("every action", () => {
  it("finds the files of actions", () => {
    expect(actionFiles).toContain("src/features/accounts/actions.ts");
    expect(actionFiles).toContain("src/auth/switch-account.ts");
  });

  it.each(actionFiles)(
    "%s asks whether the account may, before anything else",
    (path) => {
      const notAsking = actionsNotAsking(read(path)).filter(
        (name) => !needsNoSignIn(`${path} ${name}`),
      );
      expect(notAsking).toEqual([]);
      expect(unreadableExports(read(path))).toEqual([]);
    },
  );

  it.each(sourceFiles())(
    "%s holds no action or code the check cannot see",
    (path) => {
      expect(holdsActionInside(read(path))).toBe(false);
      expect(holdsCodeLostInANote(read(path))).toBe(false);
    },
  );
});

describe("what needs no sign-in", () => {
  it.each(Object.keys(NEEDS_NO_SIGN_IN))("%s still exists", (name) => {
    const [path = "", action] = name.split(" ");
    expect(sourceFiles()).toContain(path);
    if (action !== undefined) {
      expect(exportedFunctionNames(read(path))).toContain(action);
    }
  });

  it('refuses the pick on "Ganti peran" first where it is off', () => {
    const lines = linesOf(read("src/auth/switch-account.ts"), "switchAccount");
    expect(lines[0]).toBe(
      "if (!accountSwitcherOn(currentStage())) forbidden();",
    );
  });

  it('does not find "Ganti peran" where it is off, before the accounts are read', () => {
    const lines = linesOf(
      read("src/app/(app)/ganti-peran/page.tsx"),
      "SwitchAccountPage",
    );
    const readsAccounts = lines.findIndex((line) => line.includes("database("));
    const before = lines.slice(0, readsAccounts);
    expect(readsAccounts).toBeGreaterThan(0);
    expect(before).toContain(
      "const switcherOn = accountSwitcherOn(currentStage());",
    );
    expect(before).toContain("if (!switcherOn) notFound();");
  });
});

/** The other endings the app would also serve, which are not read here. */
const UNREAD_ENDING = /\.(?:js|jsx|mjs|cjs|mts|cts)$/;

describe("where screens, addresses and actions are written", () => {
  it("is only in files the check reads", () => {
    const unread = sourceFilesEndingWith("").filter((path) =>
      UNREAD_ENDING.test(path),
    );
    expect(unread).toEqual([]);
  });

  it.each(["app", "pages", "src/pages"])(
    "is never the folder %s, which the check does not read",
    (folder) => {
      expect(existsSync(folder)).toBe(false);
    },
  );
});
