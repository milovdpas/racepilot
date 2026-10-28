import "server-only";
import type { DriveFileMeta } from "@/lib/drive/types";

export const PRODUCTION_FILE_NAME = "marathon-tracker.json";

/**
 * The one file sync keeps in Drive's app-data folder. `next dev` gets its own:
 * localhost and the live site use the same OAuth client, so signed in with the
 * same account they share the folder, and newest-wins between the two would
 * let a development browser's data replace the athlete's real plans (it did).
 * Separate files keep sync testable locally without that reach.
 * `DRIVE_FILE_NAME` overrides either default.
 */
export function driveFileName(): string {
  return (
    process.env.DRIVE_FILE_NAME ||
    (process.env.NODE_ENV === "development"
      ? "marathon-tracker.dev.json"
      : PRODUCTION_FILE_NAME)
  );
}

/** Thrown on a Drive 401 → caller returns HTTP 401 so the client re-auths. */
export class DriveUnauthorizedError extends Error {
  constructor() {
    super("UNAUTHORIZED");
    this.name = "DriveUnauthorizedError";
  }
}

async function driveFetch(
  token: string,
  url: string,
  init: RequestInit,
): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 401) throw new DriveUnauthorizedError();
  return res;
}

export async function findFile(token: string): Promise<DriveFileMeta | null> {
  const q = encodeURIComponent(`name='${driveFileName()}'`);
  const res = await driveFetch(
    token,
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,modifiedTime)`,
    { method: "GET" },
  );
  if (!res.ok) throw new Error(`Drive list failed (${res.status})`);
  const data = await res.json();
  const file = data.files?.[0];
  return file ? { id: file.id, modifiedTime: file.modifiedTime } : null;
}

export async function downloadFile(token: string, id: string): Promise<string> {
  const res = await driveFetch(
    token,
    `https://www.googleapis.com/drive/v3/files/${id}?alt=media`,
    { method: "GET" },
  );
  if (!res.ok) throw new Error(`Drive download failed (${res.status})`);
  return res.text();
}

export async function createFile(
  token: string,
  json: string,
): Promise<DriveFileMeta> {
  const boundary = "marathon_tracker_boundary";
  const metadata = { name: driveFileName(), parents: ["appDataFolder"] };
  const body =
    `--${boundary}\r\n` +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) +
    `\r\n--${boundary}\r\n` +
    "Content-Type: application/json\r\n\r\n" +
    json +
    `\r\n--${boundary}--`;
  const res = await driveFetch(
    token,
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,modifiedTime",
    {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    },
  );
  if (!res.ok) throw new Error(`Drive create failed (${res.status})`);
  return res.json();
}

export async function updateFile(
  token: string,
  id: string,
  json: string,
): Promise<DriveFileMeta> {
  const res = await driveFetch(
    token,
    `https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=media&fields=id,modifiedTime`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: json,
    },
  );
  if (!res.ok) throw new Error(`Drive update failed (${res.status})`);
  return res.json();
}
