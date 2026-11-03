import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SignInScreen } from "./sign-in-screen";

vi.mock("./sign-in-button", () => ({ SignInButton: () => null }));

describe("the sign-in page", () => {
  it('links to "Kebijakan privasi"', () => {
    const screen = renderToStaticMarkup(<SignInScreen message={null} />);

    expect(screen).toMatch(/<a href="\/privasi"[^>]*>Kebijakan privasi<\/a>/);
  });
});
