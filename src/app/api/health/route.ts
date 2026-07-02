import { NextResponse } from 'next/server'
import { getPayload } from '@/utilities/getPayload'

export async function GET() {
  try {
    const payload = await getPayload()
    await payload.find({ collection: 'users', limit: 1, depth: 0 })
    return NextResponse.json({ status: 'ok' }, { status: 200 })
  } catch (err) {
    return NextResponse.json(
      { status: 'error', message: err instanceof Error ? err.message : String(err) },
      { status: 503 },
    )
  }
}