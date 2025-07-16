'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowLeft, ArrowRight } from 'lucide-react'

export type WeeklyStats = {
  completionRate: number
  totalCompletions: number
  maxPossible: number
  biggestStreak: number
}

export type DifficultyChoice = 'easier' | 'same' | 'harder' | null

export default function WeeklyReportModal({
  onClose,
  stats,
  summary,
  nextWeekMessage,
  onDifficultySelect,
}: {
  onClose: () => void
  stats: WeeklyStats
  summary: string
  nextWeekMessage: string
  onDifficultySelect: (choice: DifficultyChoice) => void
}) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyChoice>(null)

  const handleFinish = () => {
    onDifficultySelect(selectedDifficulty)
    onClose()
  }

  const slides = [
    {
      title: 'Your Weekly Stats',
      content: (
        <>
          <p className="text-xl font-semibold">
            You completed {stats.completionRate}% of your habits this week!
          </p>
          <p className="mt-2">
            Biggest streak: <strong>{stats.biggestStreak} days</strong>
          </p>
          <p className="mt-1">
            Total completions: <strong>{stats.totalCompletions} / {stats.maxPossible}</strong>
          </p>
        </>
      ),
    },
    {
      title: 'AI Summary',
      content: <p className="text-lg italic">{summary}</p>,
    },
    {
      title: 'Next Week Preview',
      content: (
        <>
          <p className="text-lg mb-4">{nextWeekMessage}</p>
          <div className="text-left">
            <p className="font-medium mb-2">
              Would you like to adjust next week's difficulty?
            </p>
            <div className="flex gap-2">
              {['easier', 'same', 'harder'].map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedDifficulty(level as DifficultyChoice)}
                  className={`px-4 py-2 rounded border transition ${
                    selectedDifficulty === level ? 'bg-[#367BDB] text-white' : 'bg-white text-black'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              If you don’t choose, the system will decide based on your weekly score.
            </p>
          </div>
        </>
      ),
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-black"
        >
          <X size={20} />
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold mb-4 text-[#367BDB]">
              {slides[currentSlide].title}
            </h2>
            <div className="text-gray-800">{slides[currentSlide].content}</div>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => setCurrentSlide((s) => Math.max(0, s - 1))}
            disabled={currentSlide === 0}
            className={`px-3 py-1 rounded hover:bg-gray-100 ${
              currentSlide === 0 ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            <ArrowLeft />
          </button>

          {currentSlide === slides.length - 1 ? (
            <button
              onClick={handleFinish}
              className="px-4 py-2 rounded bg-[#367BDB] text-white hover:bg-blue-600"
            >
              Confirm
            </button>
          ) : (
            <button
              onClick={() => setCurrentSlide((s) => Math.min(slides.length - 1, s + 1))}
              className={`px-3 py-1 rounded hover:bg-gray-100 ${
                currentSlide === slides.length - 1 ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              <ArrowRight />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
