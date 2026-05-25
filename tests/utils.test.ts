import { base64Encode } from "../src/utils";
import { describe, expect, it } from "vitest";

describe("utils", () => {
  describe("base64Encode", () => {
    it("should encode ascii strings", () => {
      expect(base64Encode(":password")).toBe("OnBhc3N3b3Jk");
    });

    it("should encode utf-8 strings", () => {
      expect(base64Encode(":pässword")).toBe("OnDDpHNzd29yZA==");
    });

    it("should pad encoded output", () => {
      expect(base64Encode("a")).toBe("YQ==");
      expect(base64Encode("ab")).toBe("YWI=");
      expect(base64Encode("abc")).toBe("YWJj");
    });
  });
});
