import { describe, expect, it } from "vitest";
import { MAX_FILE_SIZE_BYTES, MAX_VAULT_SIZE_BYTES, normalizeExternalUrl, validateUploadBatch } from "./workspace-validation";

describe("workspace input validation", () => {
  it("limits individual files and total vault size", () => {
    expect(validateUploadBatch([{ name: "large.pdf", size: MAX_FILE_SIZE_BYTES + 1 }], 0)).toContain("20 MB");
    expect(validateUploadBatch([{ name: "file.pdf", size: 10 }], MAX_VAULT_SIZE_BYTES)).toContain("100 MB");
    expect(validateUploadBatch([{ name: "small.pdf", size: 10 }], 0)).toBeNull();
  });
  it("accepts only complete HTTP and HTTPS research links", () => {
    expect(normalizeExternalUrl("https://example.com")).toBe("https://example.com/");
    expect(normalizeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeExternalUrl("not a link")).toBeNull();
    expect(normalizeExternalUrl("")).toBe("");
  });
});
