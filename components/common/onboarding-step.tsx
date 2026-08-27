"use client";

import type { LucideIcon } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * One onboarding prompt: icon, title, body, an optional preview, and a
 * two-button footer. Dismissing the dialog counts as skipping, so there is no
 * way to close it without a decision being recorded.
 *
 * Focus goes to the title, not to whatever happens to be the first tabbable
 * thing. In a prompt whose body is a picker that first thing is an *option*,
 * and a focus ring on an option is indistinguishable from having chosen it:
 * the watch prompt looked like it came with Garmin pre-selected, and Save then
 * recorded "no watch". Focusing the heading is also what a screen reader wants
 * to hear first.
 */
export function OnboardingStep({
  icon: Icon,
  title,
  body,
  children,
  skipLabel,
  confirmLabel,
  onSkip,
  onConfirm,
  confirmDisabled = false,
  className,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  /** Optional preview between the body and the buttons. */
  children?: React.ReactNode;
  skipLabel: string;
  confirmLabel: string;
  onSkip: () => void;
  onConfirm: () => void;
  /** For a prompt whose answer comes from the children: the confirm button
   *  should not offer to save a choice that has not been made. */
  confirmDisabled?: boolean;
  className?: string;
}) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  return (
    <Dialog open onOpenChange={(open) => !open && onSkip()}>
      <DialogContent
        className={cn("sm:max-w-sm", className)}
        initialFocus={titleRef}
      >
        <DialogHeader>
          <DialogTitle
            ref={titleRef}
            tabIndex={-1}
            className="flex items-center gap-2 outline-none"
          >
            <Icon className="size-5 text-primary" /> {title}
          </DialogTitle>
          <DialogDescription>{body}</DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="outline" onClick={onSkip}>
            {skipLabel}
          </Button>
          <Button onClick={onConfirm} disabled={confirmDisabled}>
            <Icon className="size-4" /> {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
