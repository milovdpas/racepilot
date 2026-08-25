// Pulling one named file out of a zip, without unpacking the rest.
//
// A Strava export arrives as a 21 MB zip and only `activities.csv` is wanted.
// Telling the athlete to unzip it and go find that file is a real drop-off,
// and on a phone - which is what this app is built for - unzipping is awkward
// enough that most people would simply stop.
//
// Deliberately a *targeted* reader rather than a general unzipper, for two
// reasons. It needs no dependency: `DecompressionStream("deflate-raw")` is
// native in every browser this app supports, so the whole format handling is
// the header walking below. And it cannot do more than it should - the GPS
// traces in `activities/*.gpx` are never inflated, never decoded and never
// held in memory, because nothing ever asks for them.
//
// Reads are `Blob.slice()` ranges, so a 21 MB archive is never loaded whole:
// the central directory tail, then the one entry, and nothing else.
//
// Pure: no React, no DOM beyond the web-standard Blob and DecompressionStream.

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;

/** How far back to look for the end-of-central-directory record. Its trailing
 *  comment can be 64 KB, and the record itself is 22 bytes. */
const EOCD_SEARCH = 66_000;

const STORED = 0;
const DEFLATED = 8;

/** A zip we can describe but not read. The caller turns this into copy. */
export class UnreadableZipError extends Error {
  constructor(readonly reason: "zip64" | "encrypted" | "compression" | "malformed") {
    super(reason);
    this.name = "UnreadableZipError";
  }
}

async function bytes(blob: Blob, start: number, end: number): Promise<DataView> {
  const buf = await blob.slice(start, end).arrayBuffer();
  return new DataView(buf);
}

/** Locate the end-of-central-directory record by scanning the tail backwards. */
async function findEocd(blob: Blob): Promise<{ offset: number; size: number }> {
  const tailStart = Math.max(0, blob.size - EOCD_SEARCH);
  const tail = await bytes(blob, tailStart, blob.size);

  // Backwards, because the signature can legitimately appear inside file data
  // and the real record is the last one.
  for (let i = tail.byteLength - 22; i >= 0; i--) {
    if (tail.getUint32(i, true) !== EOCD_SIGNATURE) continue;

    const entries = tail.getUint16(i + 10, true);
    const size = tail.getUint32(i + 12, true);
    const offset = tail.getUint32(i + 16, true);

    // Zip64 parks these sentinels here and puts the real values in its own
    // record. Rejected rather than half-handled: an archive that needs it has
    // over 65535 entries or is over 4 GB, and the honest answer is to say so
    // and let the athlete pick the CSV directly.
    if (entries === 0xffff || size === 0xffffffff || offset === 0xffffffff) {
      throw new UnreadableZipError("zip64");
    }
    return { offset, size };
  }
  throw new UnreadableZipError("malformed");
}

interface Entry {
  name: string;
  method: number;
  compressedSize: number;
  localOffset: number;
  encrypted: boolean;
}

/** Walk the central directory. It is the authority on sizes: an entry written
 *  with a data descriptor carries zeroes in its *local* header instead. */
function readCentralDirectory(view: DataView): Entry[] {
  const entries: Entry[] = [];
  const decoder = new TextDecoder("utf-8");
  let at = 0;

  while (at + 46 <= view.byteLength) {
    if (view.getUint32(at, true) !== CENTRAL_SIGNATURE) break;

    const flag = view.getUint16(at + 8, true);
    const nameLen = view.getUint16(at + 28, true);
    const extraLen = view.getUint16(at + 30, true);
    const commentLen = view.getUint16(at + 32, true);

    const name = decoder.decode(
      new Uint8Array(view.buffer, view.byteOffset + at + 46, nameLen),
    );

    entries.push({
      name,
      method: view.getUint16(at + 10, true),
      compressedSize: view.getUint32(at + 20, true),
      localOffset: view.getUint32(at + 42, true),
      // Bit 0 of the general purpose flag.
      encrypted: (flag & 0x1) !== 0,
    });

    at += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

async function inflate(data: Blob, method: number): Promise<string> {
  if (method === STORED) return data.text();
  if (method !== DEFLATED) throw new UnreadableZipError("compression");

  // "deflate-raw" and not "deflate": a zip member is a bare deflate stream with
  // no zlib header, and the wrong one fails on the first byte.
  const stream = data.stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Response(stream).text();
}

/**
 * The first entry whose name satisfies `matches`, decoded as UTF-8 text.
 *
 * Returns `null` when the archive holds no such entry, which is a normal
 * outcome (the athlete picked the wrong zip) rather than an error. Throws
 * `UnreadableZipError` only when the archive itself cannot be read.
 */
export async function readZipEntry(
  blob: Blob,
  matches: (name: string) => boolean,
): Promise<{ name: string; text: string } | null> {
  const { offset, size } = await findEocd(blob);
  const central = await bytes(blob, offset, offset + size);
  const entry = readCentralDirectory(central).find((e) => matches(e.name));
  if (!entry) return null;
  if (entry.encrypted) throw new UnreadableZipError("encrypted");

  // The local header repeats the name and extra fields at its own lengths,
  // which are allowed to differ from the central directory's - so the data
  // offset has to be computed from this header, not that one.
  const header = await bytes(blob, entry.localOffset, entry.localOffset + 30);
  if (header.getUint32(0, true) !== LOCAL_SIGNATURE) {
    throw new UnreadableZipError("malformed");
  }
  const dataStart =
    entry.localOffset +
    30 +
    header.getUint16(26, true) +
    header.getUint16(28, true);

  const data = blob.slice(dataStart, dataStart + entry.compressedSize);
  return { name: entry.name, text: await inflate(data, entry.method) };
}

/**
 * `activities.csv` from a Strava export, wherever it sits.
 *
 * Matched by basename because an archive may or may not carry a top-level
 * folder depending on how it was zipped, and anchored to the end so a stray
 * `old-activities.csv` cannot win. Explicitly not `activities/...`, which is
 * the GPS trace folder.
 */
export function isActivitiesCsv(name: string): boolean {
  const base = name.split("/").pop()?.toLowerCase() ?? "";
  return base === "activities.csv";
}
