import { describe, it, expect } from "vitest";
import { generateApiKey, hashApiKey, verifyApiKey } from "../apikey";

describe("apikey", () => {
  it("generates a 48-char hex key with clx_ prefix", () => {
    const key = generateApiKey();
    expect(key).toMatch(/^clx_[a-f0-9]{48}$/);
  });

  it("hashes deterministically", () => {
    const key = "clx_abc123";
    expect(hashApiKey(key)).toBe(hashApiKey(key));
  });

  it("verifies correct key", () => {
    const key = generateApiKey();
    const hash = hashApiKey(key);
    expect(verifyApiKey(key, hash)).toBe(true);
  });

  it("rejects wrong key", () => {
    const key = generateApiKey();
    const hash = hashApiKey(key);
    expect(verifyApiKey("clx_wrong", hash)).toBe(false);
  });
});
