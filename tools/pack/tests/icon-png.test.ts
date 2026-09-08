import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

interface PngInfo {
  width: number;
  height: number;
  bitDepth: number;
  colorType: number;
  fileSize: number;
  isValidPng: boolean;
}

async function readPngInfo(filePath: string): Promise<PngInfo> {
  const data = await readFile(filePath);
  const fileSize = data.length;

  if (data.length < 8) {
    return { width: 0, height: 0, bitDepth: 0, colorType: 0, fileSize, isValidPng: false };
  }

  const magic = data.subarray(0, 8);
  if (!magic.equals(PNG_MAGIC)) {
    return { width: 0, height: 0, bitDepth: 0, colorType: 0, fileSize, isValidPng: false };
  }

  // IHDR: 8 (magic) + 4 (chunk length) + 4 (chunk type) = 16 bytes offset
  if (data.length < 24) {
    return { width: 0, height: 0, bitDepth: 0, colorType: 0, fileSize, isValidPng: false };
  }

  const width = data.readUInt32BE(16);
  const height = data.readUInt32BE(20);
  const bitDepth = data.readUInt8(24);
  const colorType = data.readUInt8(25);

  return { width, height, bitDepth, colorType, fileSize, isValidPng: true };
}

const LINUX_ICON_PATH = fileURLToPath(new URL("../resources/linux/icon.png", import.meta.url));
const MAC_ICON_PATH = fileURLToPath(new URL("../resources/mac/icon.png", import.meta.url));

describe("Linux AppImage icon (icon.png)", () => {
  let info: PngInfo;

  it("exists and is a valid PNG", async () => {
    info = await readPngInfo(LINUX_ICON_PATH);
    expect(info.isValidPng).toBe(true);
  });

  it("has valid IHDR dimensions (width and height >= 256)", async () => {
    info = info ?? (await readPngInfo(LINUX_ICON_PATH));
    expect(info.width).toBeGreaterThanOrEqual(256);
    expect(info.height).toBeGreaterThanOrEqual(256);
    expect(info.width).toBe(info.height);
  });

  it("is reasonably sized under 50 KB", async () => {
    info = info ?? (await readPngInfo(LINUX_ICON_PATH));
    expect(info.fileSize).toBeLessThan(50_000);
  });
});

describe("macOS icon source (icon.png)", () => {
  let info: PngInfo;

  it("exists and is a valid PNG", async () => {
    info = await readPngInfo(MAC_ICON_PATH);
    expect(info.isValidPng).toBe(true);
  });

  it("has valid IHDR dimensions (width and height >= 256)", async () => {
    info = info ?? (await readPngInfo(MAC_ICON_PATH));
    expect(info.width).toBeGreaterThanOrEqual(256);
    expect(info.height).toBeGreaterThanOrEqual(256);
    expect(info.width).toBe(info.height);
  });

  it("is reasonably sized under 50 KB", async () => {
    info = info ?? (await readPngInfo(MAC_ICON_PATH));
    expect(info.fileSize).toBeLessThan(50_000);
  });
});
