import { Payload } from 'payload'

/**
 * Downloads an image from a URL and uploads it to the Payload 'media' collection.
 * Returns the ID of the created media document.
 */
export const uploadGoogleImage = async (
  payload: Payload,
  url: string,
  firstName: string,
  lastName: string,
): Promise<string | number | null> => {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`)

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const filename = `google-profile-${Date.now()}.jpg`

    const mediaDoc = await payload.create({
      collection: 'media',
      data: {
        alt: `${firstName} ${lastName} Profile Image`,
      },
      file: {
        data: buffer,
        name: filename,
        mimetype: 'image/jpeg',
        size: buffer.byteLength,
      },
    })

    return mediaDoc.id
  } catch (error) {
    console.error('[uploadGoogleImage] Error:', error)
    return null
  }
}
