import { describe, expect, it } from "vitest";
import { checkPassword, hashPassword, newToken } from "@/lib/db";

describe("passwords", () => {
  it("verifies the right password and rejects the wrong one", () => {
    const stored = hashPassword("1234");
    expect(stored).toMatch(/^[0-9a-f]{32}:[0-9a-f]{128}$/);
    expect(checkPassword("1234", stored)).toBe(true);
    expect(checkPassword("12345", stored)).toBe(false);
    expect(checkPassword("1234", "garbage")).toBe(false);
  });

  it("salts each hash", () => {
    expect(hashPassword("x")).not.toBe(hashPassword("x"));
  });

  it("issues unguessable session tokens", () => {
    const a = newToken();
    expect(a).toHaveLength(43);
    expect(a).not.toBe(newToken());
  });
});
