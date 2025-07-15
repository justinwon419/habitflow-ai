// utils/nextDifficulty.ts

export type DifficultyChange = 'increase' | 'same' | 'decrease'

export function getNextWeekDifficultyChange(score: number): DifficultyChange {
  if (score >= 90) {
    return 'increase'
  } else if (score >= 70) {
    return 'same'
  } else {
    return 'decrease'
  }
}

export function getEncouragementMessage(change: DifficultyChange): string {
  switch (change) {
    case 'increase':
      return "You're crushing it! Get ready for a bigger challenge next week 💪"
    case 'same':
      return "You're doing great! Keep the momentum going 🔥"
    case 'decrease':
      return "It's okay to have a slower week. Next week will be a bit lighter 🌱"
  }
}
