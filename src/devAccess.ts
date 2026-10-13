// ═══════════════════════════════════════════════════════════════════════════════
// Developing-tools password — a casual-access check, not real security.
//
// The password is never stored: the code holds only its SHA-256 (hex) digest, and
// the value typed on the landing page is hashed and compared. Because the digest
// ships in the browser bundle, anyone with the code can attempt it offline, so
// pick a long passphrase. Anyone can also set the mt-dev-mode flag by hand in
// their browser storage. Real protection needs a server-side check.
//
// To set the password, run this with your own passphrase and paste the output here:
//   node -e "console.log(require('crypto').createHash('sha256').update('YOUR PASSPHRASE').digest('hex'))"
//
// While this is empty, Developing tools cannot be turned on (it fails closed).
// ═══════════════════════════════════════════════════════════════════════════════

export const DEV_PASSWORD_SHA256 = "";

const toHex = (buf: ArrayBuffer): string =>
  [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");

/** True when `attempt` hashes to `expectedSha256`. Empty expected digest never matches. */
export const verifyDevPassword = async (attempt: string, expectedSha256: string): Promise<boolean> => {
  if (!expectedSha256) return false;
  try {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(attempt));
    return toHex(digest) === expectedSha256.toLowerCase();
  } catch {
    return false;   // no Web Crypto (non-secure context): fail closed
  }
};

export const checkDevPassword = (attempt: string): Promise<boolean> =>
  verifyDevPassword(attempt, DEV_PASSWORD_SHA256);
