// components/GoalEditModal.tsx
'use client'

import { useState, useEffect } from 'react'

interface GoalEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (updatedGoal: {
    goal_title: string
    description: string
    timeline: string
    motivator: string
    future_message?: string
  }) => void
  initialGoal: {
    goal_title: string
    description: string
    timeline: string
    motivator: string
    future_message?: string
  }
}

export default function GoalEditModal({
  isOpen,
  onClose,
  onSave,
  initialGoal,
}: GoalEditModalProps) {
  const [goal, setGoal] = useState(initialGoal)

  useEffect(() => {
    setGoal(initialGoal)
  }, [initialGoal])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Edit Your Goal</h2>

        <div className="space-y-3">
          {(['goal_title', 'description', 'timeline', 'motivator', 'future_message'] as const).map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium capitalize">{field.replace('_', ' ')}</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1"
                value={goal[field] ?? ''}
                onChange={(e) =>
                  setGoal({ ...goal, [field]: e.target.value })
                }
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <button
            className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => onSave(goal)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
