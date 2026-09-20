import { NextResponse } from "next/server";
import { AUTH_COOKIE, isAuthorized, passcodeConfigured, sessionValue, verifyPasscode } from "../../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ authorized: await isAuthorized(), protected: passcodeConfigured() });
}

export async function POST(request: Request) {
  const body = await request.json();
  const passcode = String(body?.passcode || "");
  if (!verifyPasscode(passcode)) {
    return NextResponse.json({ error: "Wrong passcode" }, { status: 401 });
  }

  const response = NextResponse.json({ authorized: true });
  response.cookies.set(AUTH_COOKIE, sessionValue(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authorized: false });
  response.cookies.set(AUTH_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
