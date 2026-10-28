export interface ImageInfo {
  mime: string;
  width: number | null;
  height: number | null;
  valid: boolean;
}

/** Lê dimensões sem dependências externas (PNG, JPEG, WebP, GIF). */
export function inspectImage(buffer: Buffer): ImageInfo {
  if (buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return {
      mime: "image/png",
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
      valid: true,
    };
  }
  if (buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return {
          mime: "image/jpeg",
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
          valid: true,
        };
      }
      offset += 2 + length;
    }
    return { mime: "image/jpeg", width: null, height: null, valid: true };
  }
  if (buffer.length > 12 && buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP") {
    return { mime: "image/webp", width: null, height: null, valid: true };
  }
  if (buffer.length > 6 && buffer.subarray(0, 3).toString() === "GIF") {
    return {
      mime: "image/gif",
      width: buffer.readUInt16LE(6),
      height: buffer.readUInt16LE(8),
      valid: true,
    };
  }
  return { mime: "application/octet-stream", width: null, height: null, valid: false };
}
