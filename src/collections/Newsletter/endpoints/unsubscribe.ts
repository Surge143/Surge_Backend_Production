import { PayloadHandler } from "payload";
import { unsubscribeSuccessPage } from "../../../lib/htmlPages/unsubscribeSuccess";
import { unsubscribeFailedPage } from "../../../lib/htmlPages/unsubscribeFailed";

const htmlResponse = (body: string, status: number) =>
  new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } })

export const unsubscribeHandler: PayloadHandler = async (req) => {
  const url = new URL(req.url!)
  const token = url.searchParams.get('token')

  if (!token) {
    return htmlResponse(unsubscribeFailedPage(), 400)
  }

  const result = await req.payload.find({
    collection: 'newsletters',
    where: { unsubscribeToken: { equals: token } },
    limit: 1,
    overrideAccess: true,
  })

  if (result.totalDocs === 0) {
    return htmlResponse(unsubscribeFailedPage(), 404)
  }

  await req.payload.delete({
    collection: 'newsletters',
    id: result.docs[0].id,
    overrideAccess: true,
  })

  return htmlResponse(unsubscribeSuccessPage(), 200)
}