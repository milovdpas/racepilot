// The wizard's draft lives in React state, and connecting Google Calendar is a
// full-page redirect to Google and back. Stashing the draft in sessionStorage
// (this tab only, gone when it closes) lets the wizard reopen on the step the
// user left, instead of an empty step 1.

import type { Draft } from "@/lib/plan/request";

const KEY = "racepilot-wizard-draft";
// Long enough for a Google sign-in with two-factor, short enough that an old
// draft can't resurface when the wizard is opened again later.
const TTL_MS = 30 * 60_000;

export interface StashedDraft {
  draft: Draft;
  step: number;
}

export function stashDraft(draft: Draft, step: number): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ draft, step, at: Date.now() }));
  } catch {
    // Storage blocked: the redirect still works, the draft just isn't kept.
  }
}

/** The stashed draft, if a fresh one exists. Reads only; see `clearStashedDraft`. */
export function readStashedDraft(): StashedDraft | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as StashedDraft & { at?: number };
    if (!s?.draft || !s.at || Date.now() - s.at > TTL_MS) return null;
    return { draft: s.draft, step: s.step };
  } catch {
    return null;
  }
}

export function clearStashedDraft(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
