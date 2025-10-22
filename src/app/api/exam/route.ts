import { NextRequest, NextResponse } from "next/server";
import { getScoreByUserId, deleteScore, submitAndScoreEssays, savedScore } from '@/app/lib/supabase/client';
import { parseSessionToken, SESSION_COOKIE_NAME } from '@/app/lib/server/auth';


export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
        const user = await parseSessionToken(token);

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const score = await getScoreByUserId(user.id);
        if (!score) {
            return NextResponse.json({ error: "Score not found" }, { status: 404 });
        }
        return NextResponse.json({ score });
    } catch (error) { 
        const message = error instanceof Error ? error.message : "Terjadi kesalahan";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
        const user = await parseSessionToken(token);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = await req.json();
        const {action} = body;

        if (action === 'submit-essays'){
            const { essays } = body;
            const scores = await submitAndScoreEssays(essays);
            const Score = await savedScore(
                user.id,
                scores.task_achievement_average,
                scores.coherence_and_cohesion_average,
                scores.lexical_resource_average,
                scores.grammatical_range_average
              );
        // maybe rate-limiting
        // const job = await
              return NextResponse.json({
                message: 'Essays submitted and scored successfully',
                ...Score,
              });
            }
            return NextResponse.json(
              { error: 'Unknown action' },
              { status: 400 }
            );
          } catch (error) {
            const message = error instanceof Error ? error.message : 'An error occurred';
            console.error('Route error:', error);
            return NextResponse.json({ error: message }, { status: 500 });
          }
    }


export async function DELETE(req: NextRequest) {
    try {
        const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
        const user = await parseSessionToken(token);
        
        if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        await deleteScore(user.id);
        
        return NextResponse.json({ message: 'Score deleted successfully' });
        
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete score';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}