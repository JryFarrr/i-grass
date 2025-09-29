import { NextResponse } from "next/server";
import { buildClearSessionCookie } from "@/app/lib/server/auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  const cookie = buildClearSessionCookie();
  response.cookies.set(cookie.name, cookie.value, {
    httpOnly: cookie.httpOnly,
    sameSite: cookie.sameSite,
    secure: cookie.secure,
    path: cookie.path,
    maxAge: cookie.maxAge,
  });
  return response;
}
