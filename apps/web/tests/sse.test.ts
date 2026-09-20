import { describe, expect, it } from "vitest";
import { parseFrame } from "@/lib/api";

describe("SSE frame parsing", () => {
  it("reads event and JSON data lines", () => {
    expect(parseFrame('event: token\ndata: {"text":"Hello"}')).toEqual({ event: "token", data: { text: "Hello" } });
  });
  it("joins multi-line data", () => {
    expect(parseFrame('event: meta\ndata: {"intent":\ndata: "procedural"}')).toEqual({ event: "meta", data: { intent: "procedural" } });
  });
  it("ignores comments and malformed frames", () => {
    expect(parseFrame(": keep-alive")).toBeNull();
    expect(parseFrame("event: token\ndata: {not json")).toBeNull();
  });
});
