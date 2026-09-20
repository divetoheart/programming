import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const AUTH_COOKIE = "mournreach_session";

function signature() {
  const secret = process.env.SESSION_SECRET || process.env.GAME_PASSCODE || "local-dev";
  return createHmac("sha256", secret).update("mournreach:authorized").digest("hex");
}

export function passcodeConfigured() {
  return Boolean(process.env.GAME_PASSCODE);
}

export async function isAuthorized() {
  if (!passcodeConfigured()) return true;
  const store = await cookies();
  const value = store.get(AUTH_COOKIE)?.value || "";
  const expected = signature();
  if (value.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}

export function verifyPasscode(value: string) {
  const expected = process.env.GAME_PASSCODE;
  if (!expected) return true;
  const left = Buffer.from(value);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function sessionValue() {
  return signature();
}
