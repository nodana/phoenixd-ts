import chai from "chai";

import { base64Encode } from "../dist/utils.js";

const expect = chai.expect;

describe("utils", () => {
  describe("base64Encode", () => {
    it("should encode ascii strings", () => {
      expect(base64Encode(":password")).to.equal("OnBhc3N3b3Jk");
    });

    it("should encode utf-8 strings", () => {
      expect(base64Encode(":pässword")).to.equal("OnDDpHNzd29yZA==");
    });

    it("should pad encoded output", () => {
      expect(base64Encode("a")).to.equal("YQ==");
      expect(base64Encode("ab")).to.equal("YWI=");
      expect(base64Encode("abc")).to.equal("YWJj");
    });
  });
});
