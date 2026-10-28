"use client";

import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  Cloud,
  CloudOff,
  Loader2,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDateLocale } from "@/lib/date-locale";
import { useMounted } from "@/hooks/use-mounted";
import { useSyncStore } from "@/store/use-sync-store";

export function CloudSyncCard() {
  const { t } = useTranslation();
  const status = useSyncStore((s) => s.status);
  const configured = useSyncStore((s) => s.configured);
  const ready = useSyncStore((s) => s.ready);
  const connected = useSyncStore((s) => s.connected);
  const calendar = useSyncStore((s) => s.calendar);
  const needsReauth = useSyncStore((s) => s.needsReauth);
  const user = useSyncStore((s) => s.user);
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);
  const error = useSyncStore((s) => s.error);
  const connect = useSyncStore((s) => s.connect);
  const disconnect = useSyncStore((s) => s.disconnect);
  const syncNow = useSyncStore((s) => s.syncNow);

  const mounted = useMounted();
  // Until the session check resolves we don't know configured/connected yet.
  const loading = !mounted || !ready;

  const busy =
    status === "connecting" ||
    status === "syncing" ||
    status === "reconnecting";

  // Not configured (server env missing): render a static note.
  if (!loading && !configured) {
    return (
      <Card className="gap-0 p-4">
        <div className="mb-1 flex items-center gap-2">
          <CloudOff className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">{t("sync.title")}</h3>
        </div>
        <p className="text-xs text-muted-foreground">{t("sync.notConfigured")}</p>
      </Card>
    );
  }

  return (
    <Card className="gap-0 p-4">
      <div className="mb-1 flex items-center gap-2">
        <Cloud className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{t("sync.title")}</h3>
        {!loading && connected ? (
          needsReauth ? (
            <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-tempo">
              <span className="size-1.5 rounded-full bg-tempo" />{" "}
              {t("sync.reconnectNeeded")}
            </span>
          ) : status === "reconnecting" ? (
            <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Loader2 className="size-3 animate-spin" /> {t("sync.reconnecting")}
            </span>
          ) : (
            <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-easy">
              <span className="size-1.5 rounded-full bg-easy" />{" "}
              {t("sync.connected")}
            </span>
          )
        ) : null}
      </div>

      {loading ? (
        <div className="h-9 w-40 animate-pulse rounded-md bg-muted" />
      ) : connected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {user?.picture ? (
              // A Google-hosted avatar on an unbounded domain — not worth a
              // next.config remotePatterns entry for one 24px image.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.picture}
                alt=""
                className="size-9 rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="grid size-9 place-items-center rounded-full bg-muted text-sm">
                {user?.name?.[0] ?? "?"}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {status === "syncing"
              ? t("sync.syncing")
              : status === "reconnecting"
                ? t("sync.reconnecting")
                : needsReauth
                  ? t("sync.reauthHint")
                  : lastSyncedAt
                    ? t("sync.lastSynced", {
                        time: formatDistanceToNow(new Date(lastSyncedAt), {
                          addSuffix: true,
                          locale: getDateLocale(),
                        }),
                      })
                    : t("sync.backingUp")}
          </p>
          {calendar ? (
            <p className="text-xs text-muted-foreground">{t("sync.calendarToo")}</p>
          ) : null}

          <div className="flex gap-2">
            {needsReauth ? (
              <Button size="sm" disabled={busy} onClick={() => void connect()}>
                <RefreshCw className="size-4" /> {t("sync.reconnect")}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => void syncNow()}
              >
                {status === "syncing" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                {t("sync.syncNow")}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={disconnect}>
              <LogOut className="size-4" /> {t("sync.disconnect")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{t("sync.connectBody")}</p>
          {/* Calendar granted without Drive: the account is connected for
              the off-day picker only, and this is where to remove it. */}
          {calendar ? (
            <p className="text-xs text-muted-foreground">
              {t("sync.calendarOnly", { email: user?.email ?? "" })}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button size="sm" disabled={busy} onClick={() => void connect()}>
              {status === "connecting" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Cloud className="size-4" />
              )}
              {t("sync.connect")}
            </Button>
            {calendar ? (
              <Button variant="ghost" size="sm" onClick={disconnect}>
                <LogOut className="size-4" /> {t("sync.disconnect")}
              </Button>
            ) : null}
          </div>
        </div>
      )}

      {!loading && error && !needsReauth ? (
        <p className="mt-3 flex items-start gap-1.5 text-xs text-destructive">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </Card>
  );
}
