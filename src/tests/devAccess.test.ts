import { describe, it, expect } from "vitest";
import { verifyDevPassword } from "../devAccess";

const sha = async (s: string) =>
  [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))]
    .map(b => b.toString(16).padStart(2, "0")).join("");

describe("Developing-tools password", () => {
  it("accepts the right passphrase and rejects others", async () => {
    const digest = await sha("correct horse battery");
    expect(await verifyDevPassword("correct horse battery", digest)).toBe(true);
    expect(await verifyDevPassword("correct horse battery ", digest)).toBe(false);
    expect(await verifyDevPassword("", digest)).toBe(false);
  });

  it("fails closed when no digest is set", async () => {
    expect(await verifyDevPassword("anything", "")).toBe(false);
    expect(await verifyDevPassword("", "")).toBe(false);
  });
});
