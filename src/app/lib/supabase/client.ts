import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(supabaseUrl, supabaseKey);

export type Question = {
    id: string;
    type: string;
    prompt: string;
}


export type Score = {
    id: string;
    user_id: string;
    task_achievement_average: number;
    coherence_and_cohesion_average: number;
    lexical_resource_average: number;
    grammatical_range_average: number;
};

export async function savedScore(
    user_id: string,
    task_achievement_average: number,
    coherence_and_cohesion_average: number,
    lexical_resource_average: number,
    grammatical_range_average: number,
 ){
    const {data, error} = await supabase
    .from('scores')
    .insert({
        user_id,
        task_achievement_average,
        coherence_and_cohesion_average,
        lexical_resource_average,
        grammatical_range_average,
    })
    .select()
    .maybeSingle();
    if (error) throw error;
    return data as Score;
}

export async function getScoreByUserId(user_id: string){
    const {data, error} = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', user_id)
    .maybeSingle();

    if (error) throw error;
    return data as Score | null;
}

export async function submitAndScoreEssays(essays: string[]){
    try{
        const hfResponse = await fetch(
            `${process.env.HUGGINGFACE_API_URL}/predict/avg`, 
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ "texts" : essays }),
            });

        if (!hfResponse.ok) {
            throw new Error(`Hugging Face API error: ${hfResponse.statusText}`);
        }
    
        const hfData = await hfResponse.json();
        
        const avgPreds = hfData.average;
    
        //round to eilts format
        const averages = {
          task_achievement_average: Math.round(avgPreds.task_achievement * 2) / 2,
          coherence_and_cohesion_average: Math.round(avgPreds.coherence_and_cohesion * 2) / 2,
          lexical_resource_average: Math.round(avgPreds.lexical_resource * 2) / 2,
          grammatical_range_average: Math.round(avgPreds.grammatical_range * 2) / 2,
        };

        console.log('success :', avgPreds, averages);
        return averages;
    } catch (error) {
      console.error('Error in submitAndScoreEssays:', error);
      throw error;
    }
}

  export async function deleteScore(userId: string) {
    const { error } = await supabase
      .from('scores')
      .delete()
      .eq('user_id', userId);
    
    if (error) throw error;
}

