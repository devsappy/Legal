import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/next-path";

describe("safeNext", () => {
  it("accepts locale-relative in-app paths, with query and hash", () => {
    expect(safeNext("/home")).toBe("/home");
    expect(safeNext("/checklists/register-a-society")).toBe("/checklists/register-a-society");
    expect(safeNext("/ask?q=How%20is%20a%20member%20removed%3F&jurisdiction=mh")).toBe(
      "/ask?q=How%20is%20a%20member%20removed%3F&jurisdiction=mh",
    );
    expect(safeNext("/settings#profile")).toBe("/settings#profile");
    expect(safeNext("/")).toBe("/");
    expect(safeNext("  /home  ")).toBe("/home");
  });

  it("strips a leading locale segment so the router does not double it", () => {
    expect(safeNext("/en/checklists/x")).toBe("/checklists/x");
    expect(safeNext("/hi")).toBe("/");
    expect(safeNext("/ta/ask?q=1")).toBe("/ask?q=1");
    expect(safeNext("/enterprise")).toBe("/enterprise");
  });

  it("rejects protocol-relative and absolute URLs", () => {
    expect(safeNext("//evil.com")).toBeNull();
    expect(safeNext("//evil.com/home")).toBeNull();
    expect(safeNext("https://evil.com")).toBeNull();
    expect(safeNext("http://evil.com/")).toBeNull();
    expect(safeNext("javascript:alert(1)")).toBeNull();
    expect(safeNext("mailto:x@y.z")).toBeNull();
    expect(safeNext("/http:evil")).toBeNull();
  });

  it("rejects backslashes, control characters and encoded tricks", () => {
    expect(safeNext("/\\evil.com")).toBeNull();
    expect(safeNext("\\\\evil.com")).toBeNull();
    expect(safeNext("/home\\..\\evil")).toBeNull();
    expect(safeNext("/%2F%2Fevil.com")).toBeNull();
    expect(safeNext("/%5Cevil.com")).toBeNull();
    expect(safeNext("/home%0d%0aSet-Cookie:x")).toBeNull();
    expect(safeNext("/%E0%A4%A")).toBeNull();
    expect(safeNext("/ho\nme")).toBeNull();
    expect(safeNext("/home\t/x")).toBeNull();
  });

  it("rejects empty, missing, relative and oversized values", () => {
    expect(safeNext(null)).toBeNull();
    expect(safeNext(undefined)).toBeNull();
    expect(safeNext("")).toBeNull();
    expect(safeNext("   ")).toBeNull();
    expect(safeNext("home")).toBeNull();
    expect(safeNext("./home")).toBeNull();
    expect(safeNext("../home")).toBeNull();
    expect(safeNext("?next=/home")).toBeNull();
    expect(safeNext("#top")).toBeNull();
    expect(safeNext(`/${"a".repeat(3000)}`)).toBeNull();
  });
});
