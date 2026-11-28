import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BlobPreconditionFailedError, get, head, put } from "@vercel/blob";
import { GET, POST } from "../../api/project-plan";
import { emptyPlan, isProjectPlan, makeNode } from "../../api/_projectPlan";

vi.mock("@vercel/blob", async importOriginal => ({
  ...await importOriginal<typeof import("@vercel/blob")>(),
  get: vi.fn(),
  head: vi.fn(),
  put: vi.fn(),
}));

const tool = makeNode("work-done", null, "Work Done", "branch");
const check = makeNode("phone", tool.id, "Check labels on a phone", "task");
const plan = { ...emptyPlan, nodes: [tool, check], reviews: [{ item: check.id, prompt: "Try revealing the diagram on a phone" }] };

function request(body?: unknown, key = "test-key") {
  return new Request("http://localhost/api/project-plan", {
    method: body ? "POST" : "GET",
    headers: { "x-admin-key": key },
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("DEVELOPING_TOOLS_API_KEY", "test-key");
});
afterEach(() => vi.unstubAllEnvs());

describe("shared project plan", () => {
  it("rejects circular plans and duplicate review requests", () => {
    expect(isProjectPlan(plan)).toBe(true);
    expect(isProjectPlan({ ...plan, nodes: [{ ...tool, parent: check.id }, check] })).toBe(false);
    expect(isProjectPlan({ ...plan, nodes: [{ ...tool, needs: [check.id] }, { ...check, needs: [tool.id] }] })).toBe(false);
    expect(isProjectPlan({ ...plan, reviews: [...plan.reviews, ...plan.reviews] })).toBe(false);
  });

  it("keeps typed branches compatible with existing tasks", () => {
    for (const classification of ["subtool", "planned-feature", "live-feature"]) {
      expect(isProjectPlan({ ...plan, nodes: [{ ...tool, classification }, check] })).toBe(true);
      expect(isProjectPlan({ ...plan, nodes: [tool, { ...check, classification }] })).toBe(false);
    }
    expect(isProjectPlan({ ...plan, nodes: [{ ...tool, classification: "unknown" }, check] })).toBe(false);
  });

  it("accepts a tree for new items and keeps older records valid", () => {
    for (const tree of ["site", "developments", "resources"]) {
      expect(isProjectPlan({ ...plan, nodes: [{ ...tool, tree }, check] })).toBe(true);
    }
    expect(isProjectPlan({ ...plan, nodes: [{ ...tool, tree: "archive" }, check] })).toBe(false);
    expect(isProjectPlan(plan)).toBe(true);
  });

  it("requires the plan key before reading or writing", async () => {
    expect((await GET(request(undefined, "wrong"))).status).toBe(401);
    expect((await POST(request(plan, "wrong"))).status).toBe(401);
    expect(get).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });

  it("reads a saved revision and writes using the strong metadata ETag", async () => {
    const stored = { ...plan, revision: 1 };
    vi.mocked(get).mockImplementation(async () => ({
      statusCode: 200, stream: new Response(JSON.stringify(stored)).body!,
      blob: { etag: 'W/"compressed"' },
    }) as Awaited<ReturnType<typeof get>>);
    vi.mocked(head).mockResolvedValue({ etag: '"strong"' } as Awaited<ReturnType<typeof head>>);
    expect(await (await GET(request())).json()).toEqual(stored);
    const updated = { ...stored, nodes: [...stored.nodes, {
      ...makeNode("gravity", tool.id, "Work against gravity", "branch"),
      classification: "subtool",
    }], reviews: [] };
    const response = await POST(request(updated));
    expect(await response.json()).toEqual({ ...updated, revision: 2 });
    expect(put).toHaveBeenCalledWith("project-plan.json", expect.any(String), expect.objectContaining({ ifMatch: '"strong"', access: "private" }));
  });

  it("rejects an outdated revision and a concurrent write", async () => {
    vi.mocked(get).mockImplementation(async () => ({
      statusCode: 200, stream: new Response(JSON.stringify({ ...plan, revision: 1 })).body!,
    }) as Awaited<ReturnType<typeof get>>);
    vi.mocked(head).mockResolvedValue({ etag: '"strong"' } as Awaited<ReturnType<typeof head>>);
    expect((await POST(request(plan))).status).toBe(409);
    expect(put).not.toHaveBeenCalled();
    vi.mocked(put).mockRejectedValue(new BlobPreconditionFailedError());
    expect((await POST(request({ ...plan, revision: 1 }))).status).toBe(409);
  });
});
