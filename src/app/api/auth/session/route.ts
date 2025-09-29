import { NextRequest, NextResponse } from "next/server";
import { ensureDemoUser, parseSessionToken, SESSION_COOKIE_NAME } from "@/app/lib/server/auth";

export async function GET(req: NextRequest) {
  try {
    await ensureDemoUser();
  } catch {
    // Ignore demo seeding failure
  }

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = await parseSessionToken(token);
  return NextResponse.json({ user: user ?? null });
}
