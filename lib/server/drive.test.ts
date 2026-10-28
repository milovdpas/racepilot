import { afterEach, describe, expect, it, vi } from "vitest";
import { PRODUCTION_FILE_NAME, driveFileName } from "./drive";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("driveFileName", () => {
  it("keeps a development build away from the real file", () => {
    // localhost and the live site share the app-data folder when signed in
    // with the same account; newest-wins on one file let a dev browser
    // replace real plans.
    vi.stubEnv("NODE_ENV", "development");
    expect(driveFileName()).toBe("marathon-tracker.dev.json");
    expect(driveFileName()).not.toBe(PRODUCTION_FILE_NAME);
  });

  it("uses the real file in production, unchanged so existing backups are found", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(driveFileName()).toBe("marathon-tracker.json");
  });

  it("lets DRIVE_FILE_NAME override either", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DRIVE_FILE_NAME", "marathon-tracker.staging.json");
    expect(driveFileName()).toBe("marathon-tracker.staging.json");
  });
});
