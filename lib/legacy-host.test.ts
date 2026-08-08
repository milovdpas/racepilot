import { afterEach, describe, expect, it, vi } from "vitest";
import { NEW_HOME, isLegacyHost } from "./legacy-host";

function stubHost(hostname: string) {
  vi.stubGlobal("window", { location: { hostname } });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isLegacyHost", () => {
  it("fires on the retired Vercel deployment", () => {
    stubHost("marathon-schema.vercel.app");
    expect(isLegacyHost()).toBe(true);
  });

  it("fires on a preview deployment of that same project", () => {
    stubHost("marathon-schema-git-main-milo.vercel.app");
    expect(isLegacyHost()).toBe(true);
    stubHost("marathon-schema-abc123.vercel.app");
    expect(isLegacyHost()).toBe(true);
  });

  it("stays silent on the real home", () => {
    stubHost("racepilot.milovanderpas.nl");
    expect(isLegacyHost()).toBe(false);
  });

  // The point of the allowlist. Anyone running their own copy is not on a
  // deployment that moved, and must never be told to go to someone else's
  // domain — least of all with an "export your data" button attached.
  it("stays silent for self-hosters", () => {
    for (const host of [
      "racepilot.example.com",
      "training.someone.dev",
      "192.168.1.20",
      "racepilot.local",
    ]) {
      stubHost(host);
      expect(isLegacyHost(), host).toBe(false);
    }
  });

  it("stays silent for a fork on its own Vercel project", () => {
    stubHost("racepilot-fork.vercel.app");
    expect(isLegacyHost()).toBe(false);
    // Not merely a prefix of the legacy name.
    stubHost("marathon-schema-clone.example.com");
    expect(isLegacyHost()).toBe(false);
  });

  it("stays silent in development", () => {
    stubHost("localhost");
    expect(isLegacyHost()).toBe(false);
    stubHost("127.0.0.1");
    expect(isLegacyHost()).toBe(false);
  });

  it("returns false on the server, where there is no location", () => {
    vi.stubGlobal("window", undefined);
    expect(isLegacyHost()).toBe(false);
  });

  it("points somewhere other than the deployment it fires on", () => {
    expect(new URL(NEW_HOME).hostname).not.toBe("marathon-schema.vercel.app");
  });
});
