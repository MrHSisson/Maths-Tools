import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const cookieName = "mt-dev-session";
const lifetime = 60 * 60 * 24 * 7;
const digest = (value: string) => createHash("sha256").update(value).digest();

export function matchesSecret(value: string | null, secret: string | undefined): boolean {
  return !!value && !!secret && timingSafeEqual(digest(value), digest(secret));
}

function sign(payload: string, password: string) {
  return createHmac("sha256", password).update(`maths-tools-dev:${payload}`).digest("base64url");
}

export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  return req.headers.get("sec-fetch-site") !== "cross-site" && (!origin || origin === new URL(req.url).origin);
}

export function hasDevSession(req: Request) {
  const password = process.env.DEVELOPING_TOOLS_PASSWORD;
  if (!password || (!["GET", "HEAD"].includes(req.method) && !sameOrigin(req))) return false;
  const token = req.headers.get("cookie")?.split(";").map(entry => entry.trim())
    .find(entry => entry.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  const [expires, nonce, signature, extra] = token?.split(".") ?? [];
  return !!signature && !extra && /^\d{10}$/.test(expires) && /^[\w-]{22}$/.test(nonce)
    && Number(expires) > Date.now() / 1000
    && matchesSecret(signature, sign(`${expires}.${nonce}`, password));
}

export function devCookie(password?: string) {
  const payload = `${Math.floor(Date.now() / 1000) + lifetime}.${randomBytes(16).toString("base64url")}`;
  const token = password ? `${payload}.${sign(payload, password)}` : "";
  return `${cookieName}=${token}; Max-Age=${password ? lifetime : 0}; Path=/; HttpOnly; Secure; SameSite=Strict`;
}
