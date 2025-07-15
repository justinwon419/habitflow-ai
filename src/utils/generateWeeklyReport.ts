import { openai } from '@/lib/openai'
import { buildWeeklyReportPrompt } from './promptTemplates'
import { Habit } from '@/types/db'

export async function fetchWeeklyReport({
  score,
  habits,
  goal
}: {
  score: number
  habits: Habit[]
  goal: {
    goal_title: string
    description: string
    timeline: string
    motivator: string
    message_to_future_self?: string
  }
}) {
  const prompt = buildWeeklyReportPrompt(score, habits.map(h => h.title), goal)

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8
  })

  const content = response.choices[0]?.message?.content
  return content || 'No summary available this week.'
}

// export async function generateAndSetWeeklyReport() {
//     if (!session?.user || !activeGoal) return;

//     setIsLoadingReport(true);

//     try {
//       // Calculate the weekly score for the user
//       const score = await calculateWeeklyScore(supabase, session.user.id);

//       // Fetch full habit objects for this user (all required fields)
//       const { data: habitsData, error: habitsError } = await supabase
//         .from('habits')
//         .select('id, title, created_at, user_id')
//         .eq('user_id', session.user.id);

//       if (habitsError) throw habitsError;

//       // habitsData can be null if no habits, fallback to empty array
//       const habitsList = habitsData ?? [];

//       // Call your GPT API with full data
//       const gptResponse = await fetchWeeklyReport({
//         score,
//         habits: habitsList,
//         goal: activeGoal,
//       });

//       setWeeklyReport(gptResponse);
//     } catch (err) {
//       console.error('Failed to generate weekly report:', err);
//       setWeeklyReport('Something went wrong while generating your report.');
//     } finally {
//       setIsLoadingReport(false);
//     }
//   }