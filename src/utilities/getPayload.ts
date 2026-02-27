import { getPayload as getPayloadLocal, Payload } from 'payload'
import config from '@/payload.config'

/**
 * Global cache for the Payload instance.
 * This ensures we don't re-initialize Payload on every request in Next.js 15.
 */
let cached: { client: Payload | null; promise: Promise<Payload> | null } = (global as any).payload

if (!cached) {
    cached = (global as any).payload = { client: null, promise: null }
}

export const getPayload = async (): Promise<Payload> => {
    if (cached.client) {
        return cached.client
    }

    if (!cached.promise) {
        const payloadConfig = await config
        cached.promise = getPayloadLocal({ config: payloadConfig })
    }

    try {
        cached.client = await cached.promise
    } catch (e) {
        cached.promise = null
        throw e
    }

    return cached.client
}
