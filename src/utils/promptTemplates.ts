// utils/promptTemplates.ts
import { GoalInput } from './generateHabits'
import { DifficultyChange } from './nextDifficulty'

export function generateHabitPrompt(goal: GoalInput, difficulty?: DifficultyChange): string {

  const basePrompt = `
    You are a helpful assistant that creates daily habits to help a user achieve their personal goal.

    The user’s goal details are:

    - Goal Title: ${goal.goal_title}
    - Description: ${goal.description}
    - Timeline: ${goal.timeline}
    - Motivator: ${goal.motivator}
  `.trim()
  
  if(!difficulty){
    return `${basePrompt}
    This is the user's first time creating habits for this goal. Please generate **5 specific beginner-friendly, daily habits** that the user can easily track and measure every day to make progress toward their goal within the timeline.

    Each habit should be:

    - Clear and actionable (e.g., "Run outside for 30 minutes", "Practice color mixing for 15 minutes")
    - Measurable (so the user can mark it done or not done)
    - Focused on progress toward the goal and tied to the motivator
    - Varied in approach but simple enough to complete daily

    ONLY return the habits as a JSON array with this format:

    [
      { "title": "Habit 1" },
      { "title": "Habit 2" },
      ...
    ]

    Make sure the habits are practical and avoid vague statements. Do NOT include any other text, explanation, or formatting.

    `.trim()
  }
  const tone =
    difficulty === 'harder'
      ? 'more challenging'
      : difficulty === 'easier'
      ? 'easier'
      : 'about the same'

  return `${basePrompt}
  This user completed their habits at a "${difficulty}" difficulty level last week. Please generate **5 specific daily habits** that are slighty ${tone} than last week.

  Each habit should be:

  - Clear and actionable (e.g., "Run outside for 30 minutes", "Practice color mixing for 15 minutes")
  - Measurable Daily (so the user can mark it done or not done everday)
  - Focused on progress toward the goal and tied to the motivator
  - Varied in approach but simple enough to complete daily

  ONLY return the habits as a JSON array with this format:

  [
    { "title": "Habit 1" },
    { "title": "Habit 2" },
    ...
  ]

  Make sure the habits are practical and avoid vague statements. Do NOT include any other text, explanation, or formatting.

`
}

export function buildWeeklyReportPrompt(
  score: number, 
  habits: string[],
  goal:{
    goal_title: string
    description: string
    timeline: string
    motivator: string
    message_to_future_self?: string
}){
    return ` 
    This is a weekly progress report for a habit tracking app. The user’s goal details are:

- Goal Title: ${goal.goal_title}
- Description: ${goal.description}
- Timeline: ${goal.timeline}
- Motivator: ${goal.motivator}

They completed habits with a score of ${score}/100 over the course of the week.

Here are the habits they were working on:
${habits.map((h, i) => `  ${i + 1}. ${h}`).join('\n')}

Based on this, generate:
- A short encouraging summary that is fun and exciting.
- Constructive feedback (if needed).
- A motivational message for the next week.

Keep it positive (warm & inspirational), brief (under 100 words), and tailored to someone tracking personal goals.
`
}
