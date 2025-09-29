import { NextRequest, NextResponse } from "next/server";
import { buildSessionCookie, createSessionToken, createUser } from "@/app/lib/server/auth";

const KNOWN_ERRORS = new Set([
  "Nama wajib diisi",
  "Format email tidak valid",
  "Password minimal 6 karakter",
  "Email sudah terdaftar",
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
    }

    const user = await createUser(name, email, password);
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
    const status = KNOWN_ERRORS.has(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
