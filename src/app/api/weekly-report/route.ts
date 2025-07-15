// For App Router: src/app/api/weekly-report/route.ts
import { NextResponse } from 'next/server'
import { fetchWeeklyReport } from '@/utils/generateWeeklyReport'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { score, habits, goal } = body

    const summary = await fetchWeeklyReport({ score, habits, goal })
    return NextResponse.json({ summary })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
  }
}
