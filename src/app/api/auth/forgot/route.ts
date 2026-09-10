import { NextRequest, NextResponse } from "next/server";
import { supabase } from '@/app/lib/supabase/client';
import { createAdminSupabase } from '@/app/lib/supabase/admin';
import crypto from "crypto";

// POST /api/auth/forgot  { email }
// Membuat token reset (30 menit), dikirim via email (Resend) jika API key diset.
// Tanpa email service: link hanya muncul di log server (vercel logs) atau dev link saat non-production.
export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

        // Selalu jawab sama (tidak membocorkan apakah email terdaftar)
        const ok = NextResponse.json({ ok: true, message: "Jika email terdaftar, tautan reset akan dikirim ke emailmu." });
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return ok;

        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (!user) return ok;

        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

        const admin = createAdminSupabase();
        const { error } = await admin
            .from('password_reset_tokens')
            .insert({ user_id: user.id, token_hash: tokenHash, expires_at: expiresAt, used: false });
        if (error) throw error;

        const origin = new URL(req.url).origin;
        const link = `${origin}/auth/reset?token=${token}`;

        if (process.env.RESEND_API_KEY) {
            const res = await fetch("https://api.resend.com/emails", {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: "onboarding@resend.dev",
                    to: email,
                    subject: "Reset Password i-Grass",
                    html: `<p>Klik tautan berikut untuk mengatur ulang password i-Grass (berlaku 30 menit):</p><p><a href="${link}">${link}</a></p><p>Jika kamu tidak meminta reset, abaikan email ini.</p>`,
                }),
            });
            if (!res.ok) console.error('Resend error:', await res.text());
        } else {
            console.log('[password-reset] link untuk', email, ':', link);
        }

        if (process.env.NODE_ENV !== 'production') {
            return NextResponse.json({ ok: true, devLink: link });
        }
        return ok;
    } catch (error) {
        const message = error instanceof Error ? error.message : "Terjadi kesalahan";
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
