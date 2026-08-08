"use client";

import { cloneElement, isValidElement, useId } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * A labelled form control. An app convention rather than a shadcn primitive,
 * so it lives here and not in components/ui (which is CLI-scaffolded).
 *
 * The label is genuinely associated with what it labels, which it previously
 * wasn't: it rendered a bare `<Label>` next to its children, so a screen reader
 * announced an unlabelled textbox, and `getByLabelText` found nothing. Two
 * shapes get two treatments, because they are not the same thing:
 *
 *  - **One control** (an `Input`, a `Select` trigger) gets an id and a matching
 *    `htmlFor`. A caller's own `id` always wins, so nothing that already
 *    associates itself is disturbed.
 *  - **Several children, or a group of buttons** (the sport picker) has no
 *    single control to point at, so it becomes a labelled `role="group"`.
 *    Pointing `htmlFor` at the first button would silently label one option
 *    with the name of the whole field.
 */
/** HTML elements a `<label for>` may legally point at. */
const LABELABLE_TAGS = new Set([
  "input",
  "select",
  "textarea",
  "button",
  "meter",
  "output",
  "progress",
]);

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  const id = useId();
  const labelId = `${id}-label`;
  const controlId = `${id}-control`;

  const element = isValidElement<{ id?: string }>(children) ? children : null;
  // A single child is not automatically something a label can point at. Our
  // controls are components (`Input`, `Select`, `TimeField`), so a *host*
  // element child is a plain wrapper — the sport picker is a `<div>` of
  // buttons — and `htmlFor` aimed at a div associates nothing at all, silently.
  const single =
    element &&
    (typeof element.type !== "string" || LABELABLE_TAGS.has(element.type))
      ? element
      : null;
  const existingId = single?.props.id;

  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label
        id={labelId}
        htmlFor={single ? (existingId ?? controlId) : undefined}
        className="text-xs text-muted-foreground"
      >
        {label}
      </Label>
      {single ? (
        existingId ? (
          single
        ) : (
          cloneElement(single, { id: controlId })
        )
      ) : (
        <div role="group" aria-labelledby={labelId} className="grid gap-1.5">
          {children}
        </div>
      )}
    </div>
  );
}
