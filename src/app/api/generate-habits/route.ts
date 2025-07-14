import { NextRequest, NextResponse } from 'next/server'
import { generateHabits } from '@/utils/generateHabits'

export async function POST(req: NextRequest) {
  const { goal_title, description, motivator, messageToFutureSelf, timeline } = await req.json()

  try {
    const habits = await generateHabits({
      goal_title,
      description,
      motivator,
      message_to_future_self: messageToFutureSelf,
      timeline,
    })

    return NextResponse.json({ habits })
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
