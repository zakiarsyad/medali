import { isValidElement, type ReactElement, type ReactNode } from "react";

/*
 * A way to draw a screen part and press what it shows, for the checks.
 * The checks run without a browser, so a part is drawn by calling it:
 * that works for a part that keeps nothing itself. A part that does is
 * named in `kept` and left as it is, to be found and looked at.
 */

type Props = Record<string, unknown>;
type Part = (props: Props) => ReactNode;
export type Drawn = ReactElement<Props>[];

/** Every element a screen part draws, the parts inside it drawn too. */
export function draw(node: ReactNode, kept: readonly unknown[] = []): Drawn {
  if (Array.isArray(node)) return node.flatMap((each) => draw(each, kept));
  if (!isValidElement<Props>(node)) return [];
  if (typeof node.type === "function" && !kept.includes(node.type)) {
    return draw((node.type as Part)(node.props), kept);
  }
  return [node, ...draw(node.props.children as ReactNode, kept)];
}

/** The words inside an element, without the elements around them. */
export function wordsOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return `${node}`;
  if (Array.isArray(node)) return node.map(wordsOf).join("");
  if (!isValidElement<Props>(node)) return "";
  return wordsOf(node.props.children as ReactNode);
}

function named(drawn: Drawn, type: string, words: string) {
  return drawn.find(
    (element) => element.type === type && wordsOf(element) === words,
  );
}

/** The words of every button and of every way to pick a file, in order. */
export function offered(drawn: Drawn): string[] {
  return drawn
    .filter(({ type }) => type === "button" || type === "label")
    .map(wordsOf);
}

/** Whether a button is shown and can be pressed. */
export function isPressable(drawn: Drawn, words: string): boolean {
  const button = named(drawn, "button", words);
  return button !== undefined && button.props.disabled !== true;
}

/**
 * Presses a button, as a click would: one that is not shown is an error
 * of the check, and one that is switched off does nothing.
 */
export function press(drawn: Drawn, words: string): unknown {
  const button = named(drawn, "button", words);
  if (button === undefined) throw new Error(`No button "${words}" is shown.`);
  if (button.props.disabled === true) return undefined;
  return (button.props.onClick as () => unknown)();
}

/** Picks a file with the way to pick that has these words. */
export function pickFile(drawn: Drawn, words: string, file: File): void {
  const label = named(drawn, "label", words);
  if (label === undefined) throw new Error(`No way to pick "${words}".`);
  const [input] = draw(label.props.children as ReactNode);
  if (input?.type !== "input") throw new Error(`"${words}" takes no file.`);
  if (input.props.disabled === true) return;
  const change = input.props.onChange as (event: unknown) => void;
  change({ target: { files: [file], value: file.name } });
}
