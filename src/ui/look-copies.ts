import { type Rule, rulesOf } from "./css-rules";

/*
 * A screen takes a shared look by composing it straight from the shared
 * screen styles. A class that composes a class which itself composes one
 * from another file does not get that one's look: "Belum diumumkan…" on
 * Asrama › Kegiatan showed without its box that way.
 */
const SHARED_LOOK =
  /^([\w-]+) from "(?:\.\.?\/)+(?:ui\/)?data-screen\.module\.css"$/;
const CARD_NAME = /^\.(?:card|[\w-]+Card)$/;
const CARD_LOOK = [
  "padding",
  "border",
  "border-color",
  "border-radius",
  "background",
  "box-shadow",
  "gap",
];
const NOTE_NAME = /note|Note|warn|Warn/;
const NOTE_LOOKS = new Set(["note", "warningNote"]);
const NOTE_LOOK = [
  "padding",
  "border",
  "border-color",
  "border-radius",
  "background",
  "color",
  "font-size",
];
const NO_LINE = new Set(["0", "none"]);

function sharedLookOf(rule: Rule): string | undefined {
  const composed = rule.declarations.get("composes") ?? "";
  return SHARED_LOOK.exec(composed)?.[1];
}

function setsAny(rule: Rule, properties: string[]): boolean {
  return properties.some((property) => rule.declarations.has(property));
}

function selectorsOf(rule: Rule): string[] {
  return rule.selector.split(",").map((part) => part.trim());
}

function hasLine(rule: Rule): boolean {
  const line = rule.declarations.get("border");
  if (line !== undefined && !NO_LINE.has(line)) return true;
  return rule.declarations.has("border-color");
}

function hasShadow(rule: Rule): boolean {
  const shadow = rule.declarations.get("box-shadow");
  return shadow !== undefined && shadow !== "none";
}

function looksLikeCard(rule: Rule): boolean {
  if (selectorsOf(rule).some((part) => CARD_NAME.test(part))) return true;
  if (!hasLine(rule)) return false;
  const cardCorner =
    rule.declarations.get("border-radius") === "var(--radius-lg)";
  return cardCorner || hasShadow(rule);
}

function isCardCopy(rule: Rule): boolean {
  const shared = sharedLookOf(rule);
  if (shared === "card") return setsAny(rule, CARD_LOOK);
  if (shared !== undefined) return false;
  return looksLikeCard(rule);
}

/**
 * The selectors of a style file whose rule draws a card of its own: a
 * class named as a card, or a box with the card's corner or a shadow,
 * that does not take the shared card look, or takes it and changes it.
 */
export function cardCopies(stylesheet: string): string[] {
  return rulesOf(stylesheet)
    .filter(isCardCopy)
    .map((rule) => rule.selector);
}

function looksLikeNote(rule: Rule): boolean {
  if (!hasLine(rule)) return false;
  const greyBox =
    rule.declarations.get("background") === "var(--surface2)" &&
    rule.declarations.has("padding");
  if (greyBox) return true;
  return selectorsOf(rule).some((part) => NOTE_NAME.test(part));
}

function isNoteCopy(rule: Rule): boolean {
  const shared = sharedLookOf(rule);
  if (shared !== undefined && NOTE_LOOKS.has(shared)) {
    return setsAny(rule, NOTE_LOOK);
  }
  if (shared !== undefined) return false;
  return looksLikeNote(rule);
}

/**
 * The selectors of a style file whose rule draws a note of its own: a
 * grey box with a line and inner space, or a class named as a note or a
 * warning that
 * draws a line, that does not take the shared note look, or takes it and
 * changes it.
 */
export function noteCopies(stylesheet: string): string[] {
  return rulesOf(stylesheet)
    .filter(isNoteCopy)
    .map((rule) => rule.selector);
}
