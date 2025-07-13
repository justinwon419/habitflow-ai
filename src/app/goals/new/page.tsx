// app/goals/new/page.tsx

'use client'

import GoalCreateLogic from '../GoalCreateLogic'

export default function NewGoalPage() {
  return (
    <div className="min-h-screen bg-[#f9fafb] px-4 py-8">
      <GoalCreateLogic />
    </div>
  )
}
