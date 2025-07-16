// utils/generateHabits.ts
import { openai } from '@/lib/openai'
import { generateHabitPrompt } from './promptTemplates'

export interface GoalInput {
  goal_title: string
  description: string
  timeline: string
  motivator: string
  message_to_future_self?: string
}

export interface Habit {
  title: string
}

export async function generateHabits(goal: GoalInput, difficulty?: 'harder' | 'same' | 'easier'): Promise<Habit[]> {
  const prompt = generateHabitPrompt(goal, difficulty)

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    })

    // The content should be a JSON string array like '[{"title":"Habit 1"},{"title":"Habit 2"}]'
    const content = response.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No response content from AI')
    }

    // Parse JSON safely
    let habits: Habit[] = []
    try {
      habits = JSON.parse(content)
    } catch (e) {
      throw new Error('Failed to parse AI response as JSON: ' + e)
    }

    return habits
  } catch (error) {
    console.error('Error generating habits:', error)
    throw error
  }
}
