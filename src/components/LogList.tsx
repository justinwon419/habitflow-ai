'use client'

import { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type Log = {
  id: number
  content: string
  created_at: string
}

export default function LogList({ groupedLogs }: { groupedLogs: Record<string, Log[]> }) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const [logs, setLogs] = useState(groupedLogs)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from('logs').delete().eq('id', id)
    if (!error) {
      const newLogs = { ...logs }
      for (const date in newLogs) {
        newLogs[date] = newLogs[date].filter((log) => log.id !== id)
      }
      setLogs(newLogs)
    }
  }

  const handleEdit = (log: Log) => {
    setEditingId(log.id)
    setEditContent(log.content)
    setOpenMenuId(null)
  }

  const handleSave = async (id: number) => {
    const { error } = await supabase.from('logs').update({ content: editContent }).eq('id', id)
    if (!error) {
      const newLogs = { ...logs }
      for (const date in newLogs) {
        newLogs[date] = newLogs[date].map((log) =>
          log.id === id ? { ...log, content: editContent } : log
        )
      }
      setLogs(newLogs)
      setEditingId(null)
    }
  }

  return (
    <>
      {Object.entries(logs).map(([date, logs]) => (
        <div key={date} className="mb-6">
          <h2 className="text-lg font-semibold mb-2">
            {format(new Date(date), 'EEEE, MMMM d, yyyy')}
          </h2>
          <ul className="space-y-2">
            {logs.map((log) => (
              <li key={log.id} className="bg-white p-4 rounded shadow border border-gray-200 relative">
                {editingId === log.id ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full border border-gray-300 rounded p-2"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-sm px-3 py-1 bg-gray-300 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSave(log.id)}
                        className="text-sm px-3 py-1 bg-blue-600 text-white rounded"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-700 whitespace-pre-line">{log.content}</p>

                    {/* Ellipsis Menu */}
                    <div
                      className="habit-menu absolute top-2 right-2"
                      ref={openMenuId === log.id ? menuRef : null}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenMenuId((prev) => (prev === log.id ? null : log.id))
                        }}
                        className="text-gray-500 text-xl px-2 rounded hover:bg-gray-200"
                      >
                        ⋯
                      </button>
                      {openMenuId === log.id && (
                        <div className="absolute right-0 mt-2 w-28 bg-white border border-gray-200 rounded shadow-lg z-10">
                          <button
                            onClick={() => handleEdit(log)}
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Delete this log?')) handleDelete(log.id)
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  )
}
