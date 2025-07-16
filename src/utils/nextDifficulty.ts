// utils/nextDifficulty.ts

export type DifficultyChange = 'harder' | 'same' | 'easier'

export function getNextWeekDifficultyChange(score: number): DifficultyChange {
  if (score >= 90) {
    return 'harder'
  } else if (score >= 70) {
    return 'same'
  } else {
    return 'easier'
  }
}

export function getEncouragementMessage(change: DifficultyChange): string {
  switch (change) {
    case 'harder':
      return "You're crushing it! Get ready for a bigger challenge next week 💪"
    case 'same':
      return "You're doing great! Keep the momentum going 🔥"
    case 'easier':
      return "It's okay to have a slower week. Next week will be a bit lighter 🌱"
  }
}
