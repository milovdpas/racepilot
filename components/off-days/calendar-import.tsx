"use client";

import { CalendarDays, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { formatDayLabel, formatRange, todayISO } from "@/lib/date";
import {
  CalendarAuthError,
  fetchCalendarEvents,
} from "@/lib/google-calendar/client";
import {
  type CalendarEvent,
  isAdded,
  isSuggested,
  toOffDay,
} from "@/lib/google-calendar/events";
import type { OffDay } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useSyncStore } from "@/store/use-sync-store";
import { toast } from "@/store/use-toast-store";

type Load =
  | { status: "loading" }
  | { status: "reauth" }
  | { status: "error" }
  | { status: "ready"; events: CalendarEvent[] };

const dates = (e: CalendarEvent) =>
  e.start === e.end ? formatDayLabel(e.start) : formatRange(e.start, e.end);

/**
 * Pick off days from Google Calendar. Shared by the new-plan wizard and the
 * Off days page, which differ only in where the picked off days go.
 *
 * Renders nothing when Google isn't configured on this deployment: typing the
 * dates stays the default, and this is a shortcut on top of it.
 */
export function CalendarImport({
  from,
  to,
  existing,
  onAdd,
  onBeforeConnect,
}: {
  /**
   * The plan's dates; only events touching them are listed, and never one
   * that is already over: `from` is moved up to today.
   */
  from: string;
  to: string;
  /** Off days already in the plan, so their events show as added. */
  existing: readonly OffDay[];
  onAdd: (offDays: Omit<OffDay, "id">[]) => void;
  /**
   * Runs before the full-page redirect to Google, for a caller whose state
   * would not survive it (the wizard's draft).
   */
  onBeforeConnect?: () => void;
}) {
  const { t } = useTranslation();
  const configured = useSyncStore((s) => s.configured);
  const ready = useSyncStore((s) => s.ready);
  const calendar = useSyncStore((s) => s.calendar);
  const connectCalendar = useSyncStore((s) => s.connectCalendar);

  const [open, setOpen] = useState(false);
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [showTimed, setShowTimed] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  // Only the latest request may land; an earlier one can resolve after it.
  const request = useRef(0);

  // Back from a Google consent that didn't grant the calendar: the callback
  // flags it on the URL. Say why, then drop the flag so a reload is quiet.
  useEffect(() => {
    const url = new URL(window.location.href);
    const flag = url.searchParams.get("calendar");
    if (!flag) return;
    toast.error(
      t(
        flag === "account"
          ? "calendarImport.wrongAccount"
          : "calendarImport.connectFailed",
      ),
    );
    url.searchParams.delete("calendar");
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, [t]);

  const fallback = t("calendarImport.untitled");
  // A past event can't change a plan. One that is under way still can, and
  // stays listed: the range is matched on overlap, not on start.
  const today = todayISO();
  const start = from > today ? from : today;

  const fetchEvents = async () => {
    const id = ++request.current;
    setLoad({ status: "loading" });
    try {
      const events = await fetchCalendarEvents(start, to);
      if (id === request.current) setLoad({ status: "ready", events });
    } catch (e) {
      if (id !== request.current) return;
      if (e instanceof CalendarAuthError) {
        setLoad({ status: "reauth" });
      } else {
        console.error("Calendar load failed:", e);
        setLoad({ status: "error" });
      }
    }
  };

  const openPicker = () => {
    setSelected(new Set());
    setOpen(true);
    void fetchEvents();
  };

  const connect = () => {
    onBeforeConnect?.();
    connectCalendar();
  };

  if (!ready || !configured || !from || !to || start > to) return null;

  if (!calendar) {
    return (
      <div className="space-y-1.5">
        <Button variant="outline" size="sm" onClick={connect}>
          <CalendarDays className="size-4" /> {t("calendarImport.connect")}
        </Button>
        <p className="text-xs text-muted-foreground">
          {t("calendarImport.connectHint")}
        </p>
      </div>
    );
  }

  const events = load.status === "ready" ? load.events : [];
  const visible = events.filter((e) => showTimed || isSuggested(e));
  // Only what is on screen: a timed event picked before hiding timed events
  // must not be added invisibly.
  const picked = visible.filter(
    (e) => selected.has(e.id) && !isAdded(e, existing, fallback),
  );

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const add = () => {
    onAdd(picked.map((e) => toOffDay(e, fallback)));
    setOpen(false);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={openPicker}>
        <CalendarDays className="size-4" /> {t("calendarImport.pick")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="grid grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("calendarImport.title")}</DialogTitle>
            <DialogDescription>
              {t("calendarImport.description", { range: formatRange(start, to) })}
            </DialogDescription>
            <label className="flex cursor-pointer items-center justify-between gap-3 pt-1 text-sm">
              {t("calendarImport.showTimed")}
              <Switch checked={showTimed} onCheckedChange={setShowTimed} />
            </label>
          </DialogHeader>

          <div className="min-h-0 overflow-y-auto py-1">
            {load.status === "loading" ? (
              <p className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                {t("calendarImport.loading")}
              </p>
            ) : load.status === "reauth" ? (
              <div className="space-y-3 py-4 text-center">
                <p className="text-muted-foreground">
                  {t("calendarImport.reauth")}
                </p>
                <Button size="sm" onClick={connect}>
                  <RefreshCw className="size-4" /> {t("calendarImport.reconnect")}
                </Button>
              </div>
            ) : load.status === "error" ? (
              <div className="space-y-3 py-4 text-center">
                <p className="text-muted-foreground">
                  {t("calendarImport.error")}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void fetchEvents()}
                >
                  {t("calendarImport.retry")}
                </Button>
              </div>
            ) : visible.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground">
                {t(showTimed ? "calendarImport.emptyAll" : "calendarImport.empty")}
              </p>
            ) : (
              <ul className="space-y-1.5">
                {visible.map((e) => {
                  const added = isAdded(e, existing, fallback);
                  return (
                    <li key={e.id}>
                      <label
                        className={cn(
                          "flex items-center gap-3 rounded-lg border px-3 py-2",
                          added ? "opacity-60" : "cursor-pointer hover:bg-muted",
                        )}
                      >
                        <input
                          type="checkbox"
                          className="size-4 shrink-0 accent-primary"
                          checked={added || selected.has(e.id)}
                          disabled={added}
                          onChange={() => toggle(e.id)}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">
                            {e.title || fallback}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {dates(e)}
                            {added ? ` · ${t("calendarImport.added")}` : ""}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <DialogFooter className="sm:justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button disabled={picked.length === 0} onClick={add}>
              {t("calendarImport.addSelected", { count: picked.length })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
