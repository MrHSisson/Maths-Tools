// ═══════════════════════════════════════════════════════════════════════════════
// Developing-tools password — a light check to keep casual visitors out.
// It is not security: the string is in the code, so anyone can read it.
// ═══════════════════════════════════════════════════════════════════════════════

export const DEV_PASSWORD = "Harry180";

/** True when `attempt` is exactly the Developing-tools password. */
export const checkDevPassword = (attempt: string): boolean => attempt === DEV_PASSWORD;
