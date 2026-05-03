import { describe, it, expect } from "vitest";
import { hasCJK } from "../src/lib/fonts";

describe("hasCJK", () => {
  it("detects simplified Chinese", () => {
    expect(hasCJK("示例公司")).toBe(true);
    expect(hasCJK("机密")).toBe(true);
  });

  it("detects mixed CJK + ASCII", () => {
    expect(hasCJK("Confidential 机密")).toBe(true);
    expect(hasCJK("v1.0 版本")).toBe(true);
  });

  it("detects CJK punctuation", () => {
    expect(hasCJK("「测试」")).toBe(true);
    expect(hasCJK("【DRAFT】")).toBe(true);
  });

  it("returns false for pure ASCII", () => {
    expect(hasCJK("CONFIDENTIAL")).toBe(false);
    expect(hasCJK("DRAFT")).toBe(false);
    expect(hasCJK("Hello, World!")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(hasCJK("")).toBe(false);
  });
});
