import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')

  if (!url) {
    return new NextResponse('Missing url param', { status: 400 })
  }

  const fullUrl = url.startsWith('http')
    ? url
    : `${process.env.NEXTAUTH_URL}${url}`

  try {
    const res = await fetch(fullUrl)

    if (!res.ok) {
      return new NextResponse('Image not found', { status: 404 })
    }

    const buffer = Buffer.from(await res.arrayBuffer())

    const jpeg = await sharp(buffer)
      .flatten({ background: { r: 255, g: 255, b: 255 } }) // composite transparent pixels against white
      .jpeg({ quality: 90 })
      .toBuffer()

    return new NextResponse(jpeg, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=604800, immutable', // cache 7 days — product images rarely change
      },
    })
  } catch (err) {
    console.error('[email-img] Failed to process image:', err)
    return new NextResponse('Image processing failed', { status: 500 })
  }
}
