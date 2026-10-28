import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DriveFileMeta } from "@/lib/drive/types";

// A memory localStorage, installed before the stores are imported — both use
// zustand's persist, which reads it while the module is evaluating.
const store = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: () => null,
  length: 0,
});

const drive = vi.hoisted(() => ({
  findFile: vi.fn(),
  downloadFile: vi.fn(),
  createFile: vi.fn(),
  updateFile: vi.fn(),
  fetchSession: vi.fn(),
  logout: vi.fn(),
  loginUrl: vi.fn((r: string) => `/login?returnTo=${r}`),
}));

class DriveAuthError extends Error {
  constructor() {
    super("auth");
    this.name = "DriveAuthError";
  }
}

vi.mock("@/lib/drive/client", () => ({ ...drive, DriveAuthError }));
// The example plan is dynamically imported when a store seeds; not needed here.
vi.mock("@/lib/plan/example-plan", () => ({ loadExamplePlan: vi.fn() }));

const { useSyncStore } = await import("./use-sync-store");
const { useTrainingStore } = await import("./use-training-store");

const meta = (modifiedTime: string, id = "f1"): DriveFileMeta =>
  ({ id, modifiedTime }) as DriveFileMeta;

const T1 = "2026-08-01T10:00:00.000Z";
const T2 = "2026-08-02T10:00:00.000Z";

/** A valid export bundle — `parseImport` rejects one with no plans. */
const REMOTE_BUNDLE = JSON.stringify({
  plans: {
    remote1: {
      id: "remote1",
      name: "From Drive",
      raceName: "Marathon",
      raceDistanceKm: 42.2,
      raceDate: "2026-10-11",
      goalPace: "4:58",
      goalLabel: "Sub-3:30",
      version: 1,
      createdAt: T1,
      weeks: [],
      workouts: {},
      offDays: [],
    },
  },
  activePlanId: "remote1",
});

/** Put the training store into a state with one plan and a known timestamp. */
function seedTraining(lastModified: string, withPlan = true) {
  useTrainingStore.setState({
    plans: withPlan
      ? ({ p1: { id: "p1", weeks: [], workouts: {}, offDays: [] } } as never)
      : {},
    activePlanId: withPlan ? "p1" : null,
    lastModified,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  drive.findFile.mockResolvedValue(null);
  drive.createFile.mockResolvedValue(meta(T1));
  drive.updateFile.mockResolvedValue(meta(T2));
  drive.downloadFile.mockResolvedValue(REMOTE_BUNDLE);
  drive.fetchSession.mockResolvedValue({ configured: true, connected: true });
  drive.logout.mockResolvedValue(undefined);
  useSyncStore.setState({
    status: "idle",
    configured: true,
    ready: true,
    connected: true,
    calendar: false,
    needsReauth: false,
    user: null,
    fileId: null,
    lastSyncedAt: null,
    error: null,
  });
  seedTraining(T1);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("syncNow → reconcile", () => {
  it("creates the file when Drive has none", async () => {
    drive.findFile.mockResolvedValue(null);
    await useSyncStore.getState().syncNow();

    expect(drive.createFile).toHaveBeenCalledOnce();
    expect(useSyncStore.getState().fileId).toBe("f1");
    expect(useSyncStore.getState().status).toBe("connected");
  });

  it("pulls when Drive is ahead, and adopts Drive's timestamp", async () => {
    drive.findFile.mockResolvedValue(meta(T2));
    await useSyncStore.getState().syncNow();

    expect(drive.downloadFile).toHaveBeenCalledWith("f1");
    expect(drive.updateFile).not.toHaveBeenCalled();
    // Taking the remote timestamp is what stops an immediate push back.
    expect(useTrainingStore.getState().lastModified).toBe(T2);
  });

  it("pushes when local is ahead", async () => {
    seedTraining(T2);
    drive.findFile.mockResolvedValue(meta(T1));
    await useSyncStore.getState().syncNow();

    expect(drive.updateFile).toHaveBeenCalledOnce();
    expect(drive.downloadFile).not.toHaveBeenCalled();
  });

  it("transfers nothing when the timestamps match", async () => {
    drive.findFile.mockResolvedValue(meta(T1));
    await useSyncStore.getState().syncNow();

    expect(drive.downloadFile).not.toHaveBeenCalled();
    expect(drive.updateFile).not.toHaveBeenCalled();
    expect(useSyncStore.getState().fileId).toBe("f1");
  });

  it("does not upload an empty export over a real file", async () => {
    // Local looks newer but has no plan — the window right after deleting the
    // last plan, before the replacement finishes loading.
    seedTraining(T2, false);
    drive.findFile.mockResolvedValue(meta(T1));
    await useSyncStore.getState().syncNow();

    expect(drive.updateFile).not.toHaveBeenCalled();
    expect(drive.createFile).not.toHaveBeenCalled();
    expect(useSyncStore.getState().fileId).toBe("f1");
  });

  it("does nothing at all when disconnected", async () => {
    useSyncStore.setState({ connected: false });
    await useSyncStore.getState().syncNow();
    expect(drive.findFile).not.toHaveBeenCalled();
  });
});

describe("error handling", () => {
  it("flags a reconnect on an auth failure rather than a generic error", async () => {
    drive.findFile.mockRejectedValue(new DriveAuthError());
    await useSyncStore.getState().syncNow();

    const s = useSyncStore.getState();
    expect(s.status).toBe("error");
    expect(s.needsReauth).toBe(true);
    expect(s.error).toMatch(/reconnect/i);
  });

  it("reports other failures without demanding a reconnect", async () => {
    drive.findFile.mockRejectedValue(new Error("network down"));
    await useSyncStore.getState().syncNow();

    const s = useSyncStore.getState();
    expect(s.status).toBe("error");
    expect(s.needsReauth).toBe(false);
    expect(s.error).toBe("network down");
  });

  it("leaves local training alone when Drive holds an unreadable file", async () => {
    // Better to surface an error than to replace real training with garbage.
    seedTraining(T1);
    drive.findFile.mockResolvedValue(meta(T2));
    drive.downloadFile.mockResolvedValue('{"plans":{}}');

    await useSyncStore.getState().syncNow();

    expect(useSyncStore.getState().status).toBe("error");
    expect(useTrainingStore.getState().activePlanId).toBe("p1");
    expect(useTrainingStore.getState().lastModified).toBe(T1);
  });

  it("clears needsReauth once a sync succeeds again", async () => {
    useSyncStore.setState({ needsReauth: true, error: "old" });
    drive.findFile.mockResolvedValue(meta(T1));
    await useSyncStore.getState().syncNow();

    expect(useSyncStore.getState().needsReauth).toBe(false);
    expect(useSyncStore.getState().error).toBeNull();
  });
});

describe("auto-push on local edits", () => {
  beforeEach(async () => {
    // init() binds the subscription that schedules the debounced push.
    await useSyncStore.getState().init();
    vi.clearAllMocks();
    drive.findFile.mockResolvedValue(meta(T1));
    drive.updateFile.mockResolvedValue(meta(T2));
    useSyncStore.setState({ connected: true, fileId: "f1" });
  });

  it("waits, then pushes once for a burst of edits", async () => {
    vi.useFakeTimers();
    seedTraining("2026-08-03T10:00:00.000Z");
    seedTraining("2026-08-03T10:00:01.000Z");
    seedTraining("2026-08-03T10:00:02.000Z");

    expect(drive.updateFile).not.toHaveBeenCalled(); // still debouncing
    await vi.advanceTimersByTimeAsync(3000);
    await vi.waitFor(() => expect(drive.updateFile).toHaveBeenCalledOnce());
  });

  it("does not push when disconnected", async () => {
    vi.useFakeTimers();
    useSyncStore.setState({ connected: false });
    seedTraining("2026-08-03T10:00:00.000Z");

    await vi.advanceTimersByTimeAsync(5000);
    expect(drive.updateFile).not.toHaveBeenCalled();
  });

  it("does not push back what it just pulled", async () => {
    // applyRemote changes lastModified; without suppression the subscription
    // would schedule a push and the two devices would ping-pong.
    vi.useFakeTimers();
    drive.findFile.mockResolvedValue(meta("2026-08-09T10:00:00.000Z"));
    await useSyncStore.getState().syncNow();

    await vi.advanceTimersByTimeAsync(5000);
    expect(drive.updateFile).not.toHaveBeenCalled();
  });
});

describe("disconnect", () => {
  it("clears the session locally even if the server call fails", async () => {
    drive.logout.mockRejectedValue(new Error("offline"));
    useSyncStore.setState({ connected: true, fileId: "f1", user: { email: "a" } as never });

    await useSyncStore.getState().disconnect();

    const s = useSyncStore.getState();
    expect(s.connected).toBe(false);
    expect(s.fileId).toBeNull();
    expect(s.user).toBeNull();
    expect(s.status).toBe("disconnected");
  });

  it("drops the calendar too, since revoking removes the whole grant", async () => {
    useSyncStore.setState({ connected: false, calendar: true });

    await useSyncStore.getState().disconnect();
    expect(useSyncStore.getState().calendar).toBe(false);
  });

  it("cancels a pending auto-push", async () => {
    vi.useFakeTimers();
    await useSyncStore.getState().init();
    useSyncStore.setState({ connected: true, fileId: "f1" });
    vi.clearAllMocks();

    seedTraining("2026-08-04T10:00:00.000Z");
    await useSyncStore.getState().disconnect();
    await vi.advanceTimersByTimeAsync(5000);

    expect(drive.updateFile).not.toHaveBeenCalled();
  });
});

describe("init", () => {
  it("marks an old client-OAuth session as needing reauth", async () => {
    // Persisted `connected: true` from the retired GIS flow, but the server
    // has no session — the user must reconnect rather than silently not sync.
    useSyncStore.setState({ connected: true });
    drive.fetchSession.mockResolvedValue({ configured: true, connected: false });

    await useSyncStore.getState().init();

    const s = useSyncStore.getState();
    expect(s.ready).toBe(true);
    expect(s.connected).toBe(false);
    expect(s.needsReauth).toBe(true);
  });

  it("does not demand reauth when sync was never connected", async () => {
    useSyncStore.setState({ connected: false });
    drive.fetchSession.mockResolvedValue({ configured: true, connected: false });

    await useSyncStore.getState().init();
    expect(useSyncStore.getState().needsReauth).toBe(false);
  });

  it("does not sync a session that only granted the calendar", async () => {
    // Calendar-only users have a refresh token but no Drive scope; treating
    // that as "connected" would hit Drive with a token that can't use it.
    useSyncStore.setState({ connected: false });
    drive.fetchSession.mockResolvedValue({
      configured: true,
      connected: false,
      calendar: true,
    });

    await useSyncStore.getState().init();

    const s = useSyncStore.getState();
    expect(s.calendar).toBe(true);
    expect(s.connected).toBe(false);
    expect(s.needsReauth).toBe(false);
    expect(drive.findFile).not.toHaveBeenCalled();
  });

  it("reconciles immediately when the server session is live", async () => {
    drive.fetchSession.mockResolvedValue({ configured: true, connected: true });
    drive.findFile.mockResolvedValue(meta(T1));

    await useSyncStore.getState().init();
    expect(drive.findFile).toHaveBeenCalled();
  });
});
