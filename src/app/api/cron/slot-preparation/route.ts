import { NextRequest, NextResponse } from 'next/server'
import { runSlotCron } from '@/lib/runSlotCron'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== (process.env.CRON_SECRET || 'slot-cron-internal')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { released } = await runSlotCron()
    return NextResponse.json({ success: true, released })
  } catch (err: any) {
    console.error('[SlotCron] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
