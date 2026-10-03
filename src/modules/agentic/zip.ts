import { crc32 } from "node:zlib";

/*
 * A minimal ZIP writer (stored, no compression) so the portal can hand out a small download without a new dependency
 * (CR-2026-10-04-0112; founder rule: no unapproved dependencies). Uses Node's built-in CRC-32. UTF-8 file names, a fixed
 * timestamp (so the same item always produces the same bytes), files up to 4 GB (these are tiny text files).
 */

export type ZipFile = { path: string; data: Uint8Array };

// 2026-10-04 00:00:00 in MS-DOS format.
const DOS_DATE = ((2026 - 1980) << 9) | (10 << 5) | 4;
const DOS_TIME = 0;

function u16(n: number): number[] {
  return [n & 0xff, (n >>> 8) & 0xff];
}
function u32(n: number): number[] {
  return [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];
}

export function createZip(files: readonly ZipFile[]): Buffer {
  const parts: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const f of files) {
    if (f.path.startsWith("/") || f.path.includes("..") || f.path.includes("\\")) throw new Error(`unsafe path in zip: ${f.path}`);
    const name = Buffer.from(f.path, "utf8");
    const data = Buffer.from(f.data);
    const crc = crc32(data) >>> 0;
    const local = Buffer.concat([
      Buffer.from([...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(DOS_TIME), ...u16(DOS_DATE), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0)]),
      name,
      data,
    ]);
    parts.push(local);
    central.push(
      Buffer.concat([
        Buffer.from([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(DOS_TIME), ...u16(DOS_DATE), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset)]),
        name,
      ]),
    );
    offset += local.length;
  }
  const centralBytes = Buffer.concat(central);
  const end = Buffer.from([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(centralBytes.length), ...u32(offset), ...u16(0)]);
  return Buffer.concat([...parts, centralBytes, end]);
}

/** Reads back a stored ZIP made by `createZip` (used by the tests, and a handy integrity check). */
export function readZip(zip: Uint8Array): { path: string; data: Buffer }[] {
  const buf = Buffer.from(zip);
  const eocd = buf.length - 22;
  if (buf.readUInt32LE(eocd) !== 0x06054b50) throw new Error("not a zip");
  const count = buf.readUInt16LE(eocd + 10);
  let pos = buf.readUInt32LE(eocd + 16);
  const out: { path: string; data: Buffer }[] = [];
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(pos) !== 0x02014b50) throw new Error("bad central directory");
    const crc = buf.readUInt32LE(pos + 16);
    const size = buf.readUInt32LE(pos + 24);
    const nameLen = buf.readUInt16LE(pos + 28);
    const localOffset = buf.readUInt32LE(pos + 42);
    const path = buf.subarray(pos + 46, pos + 46 + nameLen).toString("utf8");
    const lNameLen = buf.readUInt16LE(localOffset + 26);
    const lExtraLen = buf.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + lNameLen + lExtraLen;
    const data = buf.subarray(dataStart, dataStart + size);
    if ((crc32(data) >>> 0) !== crc) throw new Error(`crc mismatch for ${path}`);
    out.push({ path, data: Buffer.from(data) });
    pos += 46 + nameLen;
  }
  return out;
}
