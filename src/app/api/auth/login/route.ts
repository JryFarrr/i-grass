import { NextRequest, NextResponse } from "next/server";
import {
  authenticateUser,
  buildSessionCookie,
  createSessionToken,
  ensureDemoUser,
} from "@/app/lib/server/auth";

export async function POST(req: NextRequest) {
  try {
    await ensureDemoUser();
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!email || !password) {
      return NextResponse.json({ error: "Email dan password wajib diisi" }, { status: 400 });
    }

    const user = await authenticateUser(email, password);
    const { token } = createSessionToken(user);
    const response = NextResponse.json({ user });
    const cookie = buildSessionCookie(token);
    response.cookies.set(cookie.name, cookie.value, {
      httpOnly: cookie.httpOnly,
      sameSite: cookie.sameSite,
      secure: cookie.secure,
      path: cookie.path,
      maxAge: cookie.maxAge,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    const status = message === "Email atau kata sandi salah" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

