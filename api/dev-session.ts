import { devCookie, hasDevSession, matchesSecret, sameOrigin } from "./_devSession.js";

function json(body: object, status = 200, cookie?: string) {
  const headers = new Headers({ "cache-control": "no-store" });
  if (cookie) headers.set("set-cookie", cookie);
  return Response.json(body, { status, headers });
}

export function GET(req: Request) {
  return json({ active: hasDevSession(req) });
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Use the Developing tools menu on this site." }, 403);
  let body: { password?: unknown; lock?: unknown } | null;
  try { body = await req.json(); } catch { return json({ error: "Invalid request." }, 400); }
  if (body?.lock === true) return json({ active: false }, 200, devCookie());

  const password = process.env.DEVELOPING_TOOLS_PASSWORD;
  if (!password) return json({ error: "Developing tools access hasn’t been configured for this deployment." }, 503);
  if (typeof body?.password !== "string" || !matchesSecret(body.password, password)) {
    return json({ error: "That password is not right." }, 401);
  }
  return json({ active: true }, 200, devCookie(password));
}
