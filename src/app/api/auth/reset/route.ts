import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from '@/app/lib/supabase/admin';
import crypto from "crypto";

// POST /api/auth/reset  { token, password }
// Validasi token reset yang belum terpakai & belum kedaluwarsa, lalu ganti password.
export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const token = typeof body?.token === "string" ? body.token.trim() : "";
        const password = typeof body?.password === "string" ? body.password : "";

        if (!/^[a-f0-9]{64}$/.test(token)) {
            return NextResponse.json({ error: "Token tidak valid" }, { status: 400 });
        }
        if (password.length < 6) {
            return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
        }

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const admin = createAdminSupabase();

        const { data: row, error: e1 } = await admin
            .from('password_reset_tokens')
            .select('id, user_id')
            .eq('token_hash', tokenHash)
            .eq('used', false)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle();
        if (e1) throw e1;
        if (!row) {
            return NextResponse.json({ error: "Token tidak valid atau sudah kedaluwarsa" }, { status: 400 });
        }

        const salt = crypto.randomBytes(16).toString('hex');
        const passwordHash = crypto.scryptSync(password, salt, 64).toString('hex');

        const { error: e2 } = await admin
            .from('users')
            .update({ password_hash: passwordHash, salt })
            .eq('id', row.user_id);
        if (e2) throw e2;

        const { error: e3 } = await admin
            .from('password_reset_tokens')
            .update({ used: true })
            .eq('id', row.id);
        if (e3) throw e3;

        return NextResponse.json({ ok: true, message: "Password berhasil diatur ulang. Silakan login." });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Terjadi kesalahan";
        console.error('Reset password error:', error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
