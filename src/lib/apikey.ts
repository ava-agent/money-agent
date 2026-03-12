import { randomBytes, createHash, timingSafeEqual } from "crypto";

export function generateApiKey(): string {
  return `clx_${randomBytes(24).toString("hex")}`;
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function verifyApiKey(key: string, hash: string): boolean {
  const computed = Buffer.from(hashApiKey(key), "hex");
  const expected = Buffer.from(hash, "hex");
  if (computed.length !== expected.length) return false;
  return timingSafeEqual(computed, expected);
}
