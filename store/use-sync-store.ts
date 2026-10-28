import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  createFile,
  downloadFile,
  DriveAuthError,
  fetchSession,
  findFile,
  loginUrl,
  logout as apiLogout,
  updateFile,
  type SyncUser,
} from "@/lib/drive/client";
import { decideSync } from "@/lib/drive/sync-decision";
import { useTrainingStore } from "@/store/use-training-store";

export type SyncStatus =
  | "idle"
  | "connecting"
  | "reconnecting"
  | "syncing"
  | "connected"
  | "disconnected"
  | "error";

interface SyncState {
  status: SyncStatus;
  /** True once GOOGLE_* env is set on the server (sync is available). */
  configured: boolean;
  /** True once the initial session check has completed. */
  ready: boolean;
  /** A linked Google account with Drive sync granted. */
  connected: boolean;
  /**
   * Read-only Google Calendar is granted, for picking off days. Independent of
   * `connected`: either can be granted without the other.
   */
  calendar: boolean;
  /** Session/refresh gone — a one-tap reconnect is needed. */
  needsReauth: boolean;
  user: SyncUser | null;
  fileId: string | null;
  lastSyncedAt: string | null;
  error: string | null;

  init: () => Promise<void>;
  /**
   * Full-page redirect to Google. `returnTo` overrides where we come back to,
   * which the welcome flow needs: it calls this from /welcome, and coming back
   * to /welcome would replay the tour someone has just finished.
   */
  connect: (returnTo?: string) => void;
  /** Same redirect, asking for the calendar permission instead of Drive. */
  connectCalendar: (returnTo?: string) => void;
  /** Revokes the whole Google grant: Drive sync and Calendar together. */
  disconnect: () => Promise<void>;
  syncNow: () => Promise<void>;
}

const nowISO = () => new Date().toISOString();
const currentPath = () =>
  typeof window !== "undefined"
    ? window.location.pathname + window.location.search
    : "/";
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));
const REAUTH_MSG = "Your Google session expired — tap Reconnect.";

// --- module-scoped sync machinery (kept out of persisted state) ---
let suppressAutoPush = false;
let autoPushTimer: ReturnType<typeof setTimeout> | null = null;
let listenersBound = false;
let syncInFlight = false;

/** Stamp the training store's lastModified without triggering an auto-push. */
function stampLocal(time: string) {
  suppressAutoPush = true;
  useTrainingStore.setState({ lastModified: time });
  suppressAutoPush = false;
}

/** Bidirectional newest-wins reconcile (used on load, refocus and "Sync now"). */
async function reconcile(): Promise<void> {
  const training = useTrainingStore.getState();
  const meta = await findFile();
  const plan = decideSync({
    localModified: training.lastModified,
    hasPlan: !!training.activePlanId,
    remote: meta,
  });

  switch (plan.action) {
    case "create": {
      const created = await createFile(training.exportData());
      stampLocal(created.modifiedTime);
      useSyncStore.setState({ fileId: created.id });
      break;
    }
    case "pull": {
      const json = await downloadFile(plan.fileId);
      suppressAutoPush = true;
      useTrainingStore.getState().applyRemote(json, meta!.modifiedTime);
      suppressAutoPush = false;
      useSyncStore.setState({ fileId: plan.fileId });
      break;
    }
    case "push": {
      const updated = await updateFile(plan.fileId, training.exportData());
      stampLocal(updated.modifiedTime);
      useSyncStore.setState({ fileId: plan.fileId });
      break;
    }
    case "adopt":
      useSyncStore.setState({ fileId: plan.fileId });
      break;
    case "skip":
      break;
  }

  useSyncStore.setState({ lastSyncedAt: nowISO() });
}

/** Upload the current local state (used by the debounced auto-push). */
async function pushLocal(): Promise<void> {
  const sync = useSyncStore.getState();
  const training = useTrainingStore.getState();
  if (!sync.connected || !training.activePlanId) return;
  useSyncStore.setState({ status: "syncing", error: null });
  try {
    let id = useSyncStore.getState().fileId;
    if (!id) id = (await findFile())?.id ?? null;
    const json = training.exportData();
    const meta = id ? await updateFile(id, json) : await createFile(json);
    stampLocal(meta.modifiedTime);
    useSyncStore.setState({
      fileId: meta.id,
      lastSyncedAt: nowISO(),
      status: "connected",
      needsReauth: false,
    });
  } catch (e) {
    if (e instanceof DriveAuthError) {
      useSyncStore.setState({ status: "error", needsReauth: true, error: REAUTH_MSG });
    } else {
      useSyncStore.setState({ status: "error", error: msg(e) });
    }
  }
}

/** Pull/merge remote changes (on load, tab refocus, and "Sync now"). */
async function refresh(): Promise<void> {
  if (!useSyncStore.getState().connected || syncInFlight) return;
  syncInFlight = true;
  useSyncStore.setState({ status: "syncing", error: null });
  try {
    await reconcile();
    useSyncStore.setState({ status: "connected", needsReauth: false });
  } catch (e) {
    if (e instanceof DriveAuthError) {
      useSyncStore.setState({ status: "error", needsReauth: true, error: REAUTH_MSG });
    } else {
      useSyncStore.setState({ status: "error", error: msg(e) });
    }
  } finally {
    syncInFlight = false;
  }
}

/** Wire up auto-push (on local edits) and a refresh on tab refocus — once. */
function bindListeners() {
  if (listenersBound) return;
  listenersBound = true;

  useTrainingStore.subscribe((state, prev) => {
    if (suppressAutoPush) return;
    if (state.lastModified === prev.lastModified) return;
    if (!useSyncStore.getState().connected) return;
    if (autoPushTimer) clearTimeout(autoPushTimer);
    autoPushTimer = setTimeout(() => void pushLocal(), 3000);
  });

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState !== "visible") return;
      if (useSyncStore.getState().connected) void refresh();
    });
  }
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      status: "idle",
      configured: false,
      ready: false,
      connected: false,
      calendar: false,
      needsReauth: false,
      user: null,
      fileId: null,
      lastSyncedAt: null,
      error: null,

      init: async () => {
        bindListeners();
        // Clean up the obsolete client-token cache from the old GIS flow.
        try {
          localStorage.removeItem("marathon-drive-token");
        } catch {
          // ignore
        }
        // A stale `connected:true` may linger from the old client-OAuth persist.
        const hadLocalConnected = get().connected;
        const session = await fetchSession();
        set({
          configured: session.configured,
          connected: session.connected,
          calendar: session.calendar ?? false,
          user: session.user ?? get().user,
          ready: true,
          // Old GIS users were "connected" locally but have no server session.
          needsReauth:
            hadLocalConnected && session.configured && !session.connected,
        });
        if (session.connected) await refresh();
      },

      connect: (returnTo) => {
        window.location.href = loginUrl(returnTo ?? currentPath());
      },

      connectCalendar: (returnTo) => {
        window.location.href = loginUrl(returnTo ?? currentPath(), "calendar");
      },

      disconnect: async () => {
        if (autoPushTimer) clearTimeout(autoPushTimer);
        set({
          connected: false,
          calendar: false,
          needsReauth: false,
          user: null,
          fileId: null,
          lastSyncedAt: null,
          status: "disconnected",
          error: null,
        });
        try {
          await apiLogout();
        } catch {
          // session cookie clears on the server regardless
        }
      },

      syncNow: async () => {
        if (!get().connected) return;
        await refresh();
      },
    }),
    {
      name: "marathon-sync-v1",
      storage: createJSONStorage(() => localStorage),
      // Source of truth is now the server session; keep only the profile for an
      // instant avatar on load.
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
