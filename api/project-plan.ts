import { get, head, put, BlobNotFoundError, BlobPreconditionFailedError } from "@vercel/blob";
import { emptyPlan, isProjectPlan, type ProjectPlan } from "./_projectPlan.js";

const path = "project-plan.json";
const json = (body: unknown, status = 200) => Response.json(body, {
  status, headers: { "cache-control": "no-store" },
});

function authorised(req: Request) {
  const key = process.env.PROJECT_PLAN_KEY;
  if (!key) return json({ error: "The project plan service is not configured." }, 503);
  return req.headers.get("x-project-plan-key") === key ? null : json({ error: "Not authorised." }, 401);
}

async function read(forWrite = false): Promise<{ plan: ProjectPlan; etag?: string }> {
  try {
    // Metadata supplies a strong ETag even when the downloaded body is compressed.
    const etag = forWrite ? (await head(path)).etag : undefined;
    const result = await get(path, { access: "private", useCache: false });
    if (!result) return { plan: emptyPlan };
    if (result.statusCode !== 200) throw new Error("Unexpected project plan response");
    const plan: unknown = await new Response(result.stream).json();
    if (!isProjectPlan(plan)) throw new Error("Invalid stored project plan");
    return { plan, etag };
  } catch (error) {
    if (error instanceof BlobNotFoundError) return { plan: emptyPlan };
    throw error;
  }
}

export async function GET(req: Request) {
  const denied = authorised(req);
  if (denied) return denied;
  return json((await read()).plan);
}

export async function POST(req: Request) {
  const denied = authorised(req);
  if (denied) return denied;
  let proposed: unknown;
  try { proposed = await req.json(); } catch { return json({ error: "Invalid JSON." }, 400); }
  if (!isProjectPlan(proposed)) return json({ error: "Invalid plan. Check for missing links or circular branches." }, 400);

  const current = await read(true);
  if (current.plan.revision !== proposed.revision) return json({ error: "The shared plan changed. Reload it and try again." }, 409);
  const plan = { ...proposed, revision: proposed.revision + 1 };
  try {
    await put(path, JSON.stringify(plan), {
      access: "private", contentType: "application/json", addRandomSuffix: false,
      allowOverwrite: !!current.etag, ...(current.etag ? { ifMatch: current.etag } : {}),
    });
  } catch (error) {
    if (error instanceof BlobPreconditionFailedError || (error instanceof Error && error.message.includes("already exists"))) {
      return json({ error: "The shared plan changed. Reload it and try again." }, 409);
    }
    throw error;
  }
  return json(plan);
}
