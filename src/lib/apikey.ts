import { randomBytes, createHash } from "crypto";

export function generateApiKey(): string {
  return `clx_${randomBytes(24).toString("hex")}`;
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function verifyApiKey(key: string, hash: string): boolean {
  return hashApiKey(key) === hash;
}
