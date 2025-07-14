// app/goals/GoalForm.tsx

'use client'

import React from 'react'

interface GoalFormProps {
  goal_title: string
  setGoalTitle: (value: string) => void
  description: string
  setDescription: (value: string) => void
  timeline: string
  setTimeline: (value: string) => void
  motivator: string
  setMotivator: (value: string) => void
  futureMessage: string
  setFutureMessage: (value: string) => void
  onSubmit: () => void
  onSubmitWithAI: () => void // <- New prop
  loading: boolean
}

export default function GoalForm({
  goal_title,
  setGoalTitle,
  description,
  setDescription,
  timeline,
  setTimeline,
  motivator,
  setMotivator,
  futureMessage,
  setFutureMessage,
  onSubmit,
  onSubmitWithAI,
  loading,
}: GoalFormProps) {
  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-md mt-10">
      <h1 className="text-2xl font-bold mb-6 text-[#367BDB]">Create Your Goal</h1>

      <label className="block mb-4">
        <span className="font-semibold">Goal Title</span>
        <input
        type="text"
        value={goal_title}
        onChange={e => setGoalTitle(e.target.value)}
        className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md"
        placeholder="e.g. Become an Artist"
        required
        />
      </label>
      <label className="block mb-4">
        <span className="font-semibold">Goal Description</span>
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md"
          placeholder="e.g. I want to become a better painter"
          required
        />
      </label>

      <label className="block mb-4">
        <span className="font-semibold">Timeline</span>
        <input
          type="text"
          value={timeline}
          onChange={e => setTimeline(e.target.value)}
          className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md"
          placeholder="e.g. 3 months"
          required
        />
      </label>

      <label className="block mb-4">
        <span className="font-semibold">What motivates you to reach this goal?</span>
        <textarea
          value={motivator}
          onChange={e => setMotivator(e.target.value)}
          className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md"
          placeholder="e.g. I want to feel more confident and expressive."
          rows={3}
          required
        />
      </label>

      <label className="block mb-4">
        <span className="font-semibold">Message to Your Future Self (optional)</span>
        <textarea
          value={futureMessage}
          onChange={e => setFutureMessage(e.target.value)}
          className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md"
          placeholder="e.g. Look how far you've come!"
          rows={3}
        />
      </label>

      {/* Submit buttons */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={onSubmit}
          disabled={loading}
          className="w-1/2 bg-gray-200 text-black py-2 px-4 rounded-md hover:bg-gray-300 transition"
        >
          {loading ? 'Creating...' : 'Manual Habits'}
        </button>

        <button
          onClick={onSubmitWithAI}
          disabled={loading}
          className="w-1/2 bg-[#367BDB] text-white py-2 px-4 rounded-md hover:bg-blue-600 transition"
        >
          {loading ? 'Generating...' : 'AI-Generated Habits'}
        </button>
      </div>
    </div>
  )
}
