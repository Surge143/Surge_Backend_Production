import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import * as geolib from 'geolib'

export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const latitudeStr = searchParams.get('latitude')
    const longitudeStr = searchParams.get('longitude')

    if (!latitudeStr || !longitudeStr) {
      return NextResponse.json(
        { error: 'Missing latitude or longitude query parameters' },
        { status: 400 },
      )
    }

    const userLat = parseFloat(latitudeStr)
    const userLng = parseFloat(longitudeStr)

    if (isNaN(userLat) || isNaN(userLng)) {
      return NextResponse.json({ error: 'Invalid latitude or longitude' }, { status: 400 })
    }

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Fetch all shops
    // We only need shops where isShopOpen is true, or maybe all shops?
    // User requested "nearest store location from teh shop collection"
    // Usually you want open shops, but let's fetch all for now and provide distance.
    const shops = await payload.find({
      collection: 'shop',
      limit: 100, // Reasonable limit for shops
      depth: 0,
    })

    if (shops.docs.length === 0) {
      return NextResponse.json({ error: 'No shops found' }, { status: 404 })
    }

    // Prepare locations for geolib
    const shopLocations = shops.docs
      .filter((shop) => shop.address?.latitude && shop.address?.longitude)
      .map((shop) => ({
        id: shop.id,
        latitude: shop.address.latitude as number,
        longitude: shop.address.longitude as number,
        shop: shop,
      }))

    if (shopLocations.length === 0) {
      return NextResponse.json({ error: 'No shops with valid coordinates found' }, { status: 404 })
    }

    // Find the nearest shop
    const nearest = geolib.findNearest(
      { latitude: userLat, longitude: userLng },
      shopLocations.map((loc) => ({
        latitude: loc.latitude,
        longitude: loc.longitude,
      })),
    )

    if (!nearest) {
      return NextResponse.json({ error: 'Could not calculate nearest shop' }, { status: 500 })
    }

    // Find the matching shop from our prepared list
    const nearestShopData = shopLocations.find(
      (loc) =>
        loc.latitude === (nearest as any).latitude && loc.longitude === (nearest as any).longitude,
    )

    if (!nearestShopData) {
      return NextResponse.json(
        { error: 'Shop data not found for nearest coordinates' },
        { status: 500 },
      )
    }

    // Calculate exact distance
    const distance = geolib.getDistance(
      { latitude: userLat, longitude: userLng },
      { latitude: nearestShopData.latitude, longitude: nearestShopData.longitude },
    )

    const MAX_DISTANCE_METERS = 25000 // 25 km

    if (distance > MAX_DISTANCE_METERS) {
      return NextResponse.json(
        {
          success: false,
          message: 'no nearby cafe',
          leastDistance: distance,
          leastDistanceFormatted: `${(distance / 1000).toFixed(2)} km`,
        },
        { status: 404 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        nearestStore: nearestShopData.shop,
        leastDistance: distance, // in meters
        distanceFormatted: `${(distance / 1000).toFixed(2)} km`,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error('Nearest Cafe Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
