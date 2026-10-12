"use client";

import Form from "next/form";
import type { ChangeEvent, ReactNode } from "react";

function sendWhenChosen(event: ChangeEvent<HTMLFormElement>) {
  if (event.target instanceof HTMLSelectElement) {
    event.currentTarget.requestSubmit();
  }
}

/**
 * A form that puts its fields in the address, and sends itself as soon as
 * a choice is made from a list. A typed text is sent with its button.
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
