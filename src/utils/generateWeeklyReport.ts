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