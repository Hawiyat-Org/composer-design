import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * ICO directory entry:
 *   w (1 byte)   - width (0 = 256)
 *   h (1 byte)   - height (0 = 256)
 *   colors (1)   - color palette count (0 = no palette)
 *   reserved (1) - must be 0
 *   planes (2)   - color planes (0 or 1)
 *   bpp (2)      - bits per pixel
 *   size (4)     - image data size in bytes
 *   offset (4)   - image data offset in file
 */
const ICO_DIR_ENTRY_SIZE = 16;
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

interface IconEntry {
  icoWidth: number;
  icoHeight: number;
  pngWidth: number;
  pngHeight: number;
  offset: number;
  size: number;
}

function readPngSize(data: Buffer, offset: number): { width: number; height: number } | null {
  if (data.length < offset + 8) return null;
  const magic = data.subarray(offset, offset + 8);
  if (!magic.equals(PNG_MAGIC)) return null;

  // PNG IHDR starts at offset + 16 (8 magic + 4 length + 4 type)
  const ihdrOffset = offset + 16;
  if (data.length < ihdrOffset + 8) return null;
  const width = data.readUInt32BE(ihdrOffset);
  const height = data.readUInt32BE(ihdrOffset + 4);
  return { width, height };
}

async function parseIco(filePath: string): Promise<{
  count: number;
  entries: IconEntry[];
  fileSize: number;
}> {
  const data = await readFile(filePath);
  const fileSize = data.length;

  if (data.length < 6) throw new Error("File too small for ICO header");

  const reserved = data.readUInt16LE(0);
  const type = data.readUInt16LE(2);
  const count = data.readUInt16LE(4);

  if (reserved !== 0) throw new Error(`Invalid ICO reserved field: ${reserved}`);
  if (type !== 1) throw new Error(`Invalid ICO type field: ${type} (expected 1)`);
  if (count < 1 || count > 255) throw new Error(`Invalid icon count: ${count}`);

  const entries: IconEntry[] = [];

  for (let i = 0; i < count; i++) {
    const dirOffset = 6 + i * ICO_DIR_ENTRY_SIZE;
    if (data.length < dirOffset + ICO_DIR_ENTRY_SIZE) {
      throw new Error(`Truncated ICO directory entry ${i}`);
    }

    const w = data.readUInt8(dirOffset);
    const h = data.readUInt8(dirOffset + 1);
    const planes = data.readUInt16LE(dirOffset + 4);
    const imgSize = data.readUInt32LE(dirOffset + 8);
    const imgOffset = data.readUInt32LE(dirOffset + 12);

    if (planes !== 1) {
      throw new Error(`Icon ${i}: expected 1 color plane, got ${planes}`);
    }

    const pngSize = readPngSize(data, imgOffset);
    if (!pngSize) {
      throw new Error(`Icon ${i}: image data at offset ${imgOffset} is not valid PNG`);
    }

    entries.push({
      icoWidth: w === 0 ? 256 : w,
      icoHeight: h === 0 ? 256 : h,
      pngWidth: pngSize.width,
      pngHeight: pngSize.height,
      offset: imgOffset,
      size: imgSize,
    });
  }

  return { count, entries, fileSize };
}

const ICON_PATH = fileURLToPath(new URL("../resources/win/icon.ico", import.meta.url));

describe("Windows NSIS installer icon (icon.ico)", () => {
  let ico: Awaited<ReturnType<typeof parseIco>>;

  beforeAll(async () => {
    ico = await parseIco(ICON_PATH);
  });

  it("is a valid MS Windows ICO resource with 4 icon entries", () => {
    expect(ico.count).toBe(4);
  });

  it("contains one icon each at 16x16, 32x32, 48x48, and 256x256 (PNG interior dimensions)", () => {
    const dimensions = ico.entries.map((e) => `${e.pngWidth}x${e.pngHeight}`);
    expect(new Set(dimensions)).toEqual(new Set(["16x16", "32x32", "48x48", "256x256"]));
    expect(dimensions.length).toBe(4);
  });

  it("has ICO directory entry dimensions matching PNG interior dimensions for every icon", () => {
    for (const entry of ico.entries) {
      expect(entry.icoWidth).toBe(entry.pngWidth);
      expect(entry.icoHeight).toBe(entry.pngHeight);
    }
  });

  it("has a file size under 10 KB", () => {
    expect(ico.fileSize).toBeLessThan(10_000);
  });
});
