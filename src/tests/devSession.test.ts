import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hasDevSession } from "../../api/_devSession";
import { GET, POST } from "../../api/dev-session";

const origin = "https://maths-tools.example";
const password = "a test password for development";

function request(body?: object, headers?: HeadersInit) {
  return new Request(`${origin}/api/dev-session`, {
    method: body ? "POST" : "GET", headers, body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => vi.stubEnv("DEVELOPING_TOOLS_PASSWORD", password));
afterEach(() => vi.unstubAllEnvs());

describe("Developing tools session", () => {
  it("rejects wrong passwords and reports a missing setting", async () => {
    expect((await POST(request({ password: "wrong" }))).status).toBe(401);
    vi.stubEnv("DEVELOPING_TOOLS_PASSWORD", "");
    expect((await POST(request({ password }))).status).toBe(503);
  });

  it("checks the signed cookie and clears it on lock", async () => {
    const response = await POST(request({ password }, { origin }));
    const header = response.headers.get("set-cookie")!;
    expect(header).toContain("HttpOnly; Secure; SameSite=Strict");
    expect(header).not.toContain(password);
    const cookie = header.split(";")[0];
    expect(await GET(request(undefined, { cookie })).json()).toEqual({ active: true });
    expect(hasDevSession(new Request(`${origin}/api/project-plan`, { headers: { cookie } }))).toBe(true);
    expect(await GET(request(undefined, { cookie: `${cookie}x` })).json()).toEqual({ active: false });
    expect((await POST(request({ lock: true }, { origin, cookie }))).headers.get("set-cookie")).toContain("Max-Age=0");
    vi.stubEnv("DEVELOPING_TOOLS_PASSWORD", "rotated password");
    expect(await GET(request(undefined, { cookie })).json()).toEqual({ active: false });
  });

  it("rejects cross-origin session changes and cookie writes", async () => {
    const foreign = "https://other.example";
    expect((await POST(request({ password }, { origin: foreign }))).status).toBe(403);
    const cookie = (await POST(request({ password }))).headers.get("set-cookie")!.split(";")[0];
    expect(hasDevSession(new Request(`${origin}/api/project-plan`, { method: "POST", headers: { origin: foreign, cookie } }))).toBe(false);
  });
});
