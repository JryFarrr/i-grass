import { NextRequest, NextResponse } from "next/server";
import { supabase } from '@/app/lib/supabase/client';
import { parseSessionToken, SESSION_COOKIE_NAME } from '@/app/lib/server/auth';

type RawScore = {
    id: string;
    user_id: string;
    task_achievement_average: string | number;
    coherence_and_cohesion_average: string | number;
    lexical_resource_average: string | number;
    grammatical_range_average: string | number;
    created_at: string;
    users: { name: string | null; email: string | null } | null;
};

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
        const user = await parseSessionToken(token);

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (user.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { data, error } = await supabase
            .from('scores')
            .select('id, user_id, task_achievement_average, coherence_and_cohesion_average, lexical_resource_average, grammatical_range_average, created_at, users!inner(name, email)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const rows = (data as unknown as RawScore[]).map((r: RawScore) => ({
            id: r.id,
            user_id: r.user_id,
            name: r.users?.name ?? '(tanpa nama)',
            email: r.users?.email ?? '',
            task_achievement_average: Number(r.task_achievement_average),
            coherence_and_cohesion_average: Number(r.coherence_and_cohesion_average),
            lexical_resource_average: Number(r.lexical_resource_average),
            grammatical_range_average: Number(r.grammatical_range_average),
            overall_average:
                Math.round(((Number(r.task_achievement_average) +
                    Number(r.coherence_and_cohesion_average) +
                    Number(r.lexical_resource_average) +
                    Number(r.grammatical_range_average)) / 4) * 2) / 2,
            created_at: r.created_at,
        }));

        return NextResponse.json({ scores: rows });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Terjadi kesalahan';
        console.error('Admin scores error:', error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
