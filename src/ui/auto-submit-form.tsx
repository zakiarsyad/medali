"use client";

import Form from "next/form";
import type { ChangeEvent, ReactNode } from "react";

function isChoice(target: EventTarget): boolean {
  if (target instanceof HTMLSelectElement) return true;
  return target instanceof HTMLInputElement && target.type === "checkbox";
}

function sendWhenChosen(event: ChangeEvent<HTMLFormElement>) {
  if (isChoice(event.target)) event.currentTarget.requestSubmit();
}

/**
 * A form that puts its fields in the address, and sends itself as soon as
 * a choice is made from a list or a box is ticked. A typed text is sent
 * with its button.
 */
export function AutoSubmitForm({
  action,
  children,
}: {
  action: string;
  children: ReactNode;
}) {
  return (
    <Form action={action} onChange={sendWhenChosen}>
      {children}
    </Form>
  );
}
