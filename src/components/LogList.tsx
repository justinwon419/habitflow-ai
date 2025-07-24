'use client'

import { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type Log = { id: number; content: string; created_at: string }
export default function LogList({
  groupedLogs,
}: {
  groupedLogs: Record<string, Log[]>
}) {
  const [logsState, setLogsState] = useState(groupedLogs)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const handleDelete = async (id: number) => {
    await supabase.from('logs').delete().eq('id', id)
    const copy = { ...logsState }
    for (const day in copy) {
      copy[day] = copy[day].filter((l) => l.id !== id)
    }
    setLogsState(copy)
  }

  const startEdit = (log: Log) => {
    setEditingId(log.id)
    setEditContent(log.content)
    setOpenMenuId(null)
  }

  const saveEdit = async (id: number) => {
    await supabase.from('logs').update({ content: editContent }).eq('id', id)
    const copy = { ...logsState }
    for (const day in copy) {
      copy[day] = copy[day].map((l) =>
        l.id === id ? { ...l, content: editContent } : l
      )
    }
    setLogsState(copy)
    setEditingId(null)
  }

  return (
    <>
      {Object.entries(logsState).map(([date, items]) => (
        <div key={date} className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {format(new Date(date), 'EEEE, MMMM d, yyyy')}
          </h2>
          <ul className="space-y-4">
            {items.map((log) => (
              <li
                key={log.id}
                className="bg-white p-4 rounded-lg shadow border border-gray-200 relative"
              >
                {editingId === log.id ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 bg-gray-300 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveEdit(log.id)}
                        className="px-3 py-1 bg-[#4296F7] text-white rounded"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-700 whitespace-pre-line">{log.content}</p>

                    {/* Ellipsis menu */}
                    <div
                      className="habit-menu absolute top-2 right-2"
                      ref={openMenuId === log.id ? menuRef : null}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenMenuId((prev) =>
                            prev === log.id ? null : log.id
                          )
                        }}
                        className="text-gray-500 text-xl p-1 rounded hover:bg-gray-100"
                      >
                        ⋯
                      </button>
                      {openMenuId === log.id && (
                        <div className="absolute right-0 mt-2 w-28 bg-white border border-gray-200 rounded shadow-lg z-10">
                          <button
                            onClick={() => startEdit(log)}
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this log?')) handleDelete(log.id)
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
