// utils/promptTemplates.ts

export function generateHabitPrompt(goal: {
  goal_title: string
  description: string
  timeline: string
  motivator: string
  message_to_future_self?: string
}) {
  return `
I want to achieve the following goal:

Title: ${goal.goal_title}
Description: ${goal.description}
Timeline: ${goal.timeline}
Motivator: ${goal.motivator}
Message to future self: ${goal.message_to_future_self || ''}

Please create a roadmap of 3–5 daily habits for the first week that will help me work toward this goal.

Respond in this exact format:

[
  { "title": "Habit title" }
]
`
}
