import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PAGES } from "@/auth/pages";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import { ACTION_TITLES, ROLES } from "@/auth/roles";
import { AccessMatrix } from "./access-matrix";

const ROW = /<tr>(<td[\s\S]*?)<\/tr>/g;
const CELL = /<td[^>]*data-title="([^"]+)"[^>]*>([\s\S]*?)<\/td>/g;
const LIST_ITEM = /<li[^>]*>([\s\S]*?)<\/li>/g;
const TAG = /<[^>]+>/g;

type Row = Record<string, string>;

function words(markup: string): string {
  return markup.replace(TAG, "").replaceAll("&amp;", "&");
}

function rows(): Row[] {
  const table = renderToStaticMarkup(<AccessMatrix />);
  return [...table.matchAll(ROW)].map(([, cells = ""]) => {
    const row: Row = {};
    for (const [, title = "", value = ""] of cells.matchAll(CELL)) {
      row[title] = value;
    }
    return row;
  });
}

function rowOf(role: RoleId): Row {
  return rows()[ROLE_IDS.indexOf(role)] ?? {};
}

function rightTitles(role: RoleId): string[] {
  return ROLES[role].actions.map((action) => ACTION_TITLES[action]);
}

function menuTitles(role: RoleId): string[] {
  const menus = PAGES.filter((page) => ROLES[role].pages.includes(page.id));
  return menus.map((page) => page.title);
}

const withRights = ROLE_IDS.filter((role) => ROLES[role].actions.length > 0);
const withoutRights = ROLE_IDS.filter(
  (role) => ROLES[role].actions.length === 0,
);

describe("AccessMatrix", () => {
  it("shows every role of the permission list, in its order", () => {
    const shown = rows().map((row) => words(row.Peran ?? ""));

    expect(shown).toEqual(ROLE_IDS.map((role) => ROLES[role].title));
  });

  it.each(ROLE_IDS)("shows the menus of %s as one sentence", (role) => {
    expect(words(rowOf(role).Menu ?? "")).toBe(menuTitles(role).join(", "));
  });

  it("has roles with rights to check", () => {
    expect(withRights.length).toBeGreaterThan(0);
  });

  it.each(withRights)("gives each right of %s its own line", (role) => {
    const rights = rowOf(role).Tindakan ?? "";
    const lines = [...rights.matchAll(LIST_ITEM)].map(([, line = ""]) => line);
    const withoutCommas = lines.map((line) =>
      words(line.replace(/<span[^>]*>, <\/span>/, "")),
    );

    expect(withoutCommas).toEqual(rightTitles(role));
  });

  it.each(withRights)("reads the rights of %s as one sentence", (role) => {
    expect(words(rowOf(role).Tindakan ?? "")).toBe(
      rightTitles(role).join(", "),
    );
  });

  it.each(withoutRights)("shows - for %s, which has no right", (role) => {
    expect(rowOf(role).Tindakan).toBe("-");
  });
});
