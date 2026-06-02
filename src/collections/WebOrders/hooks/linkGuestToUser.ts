import { Payload } from 'payload'

/**
 * When a payment is completed (or order is created), check if the order belongs to a guest
 * whose email matches an existing user account. If so, link the order to that user.
 *
 * @param paidStatus - The value of paymentStatus that represents a completed payment
 *                     ('completed' for web-orders, 'paid' for app-orders)
 * @param operation  - Payload operation ('create' | 'update'). Linking at create time means
 *                     the webhook afterChange has one less nested update to trigger.
 */
export const linkGuestOrderToUser = async ({
  payload,
  doc,
  previousDoc,
  operation,
  collection,
  paidStatus,
}: {
  payload: Payload
  doc: any
  previousDoc: any
  operation?: string
  collection: string
  paidStatus: string
}): Promise<void> => {
  // Fire on brand-new orders OR when payment status just transitioned to paid.
  const isNowPaid = doc.paymentStatus === paidStatus
  const wasPreviouslyPaid = previousDoc?.paymentStatus === paidStatus
  const isCreation = operation === 'create'

  if (!isCreation && (!isNowPaid || wasPreviouslyPaid)) return

  // Only attempt linking if there is no user but there is an email stored
  const alreadyHasUser = doc.user && (typeof doc.user === 'object' ? doc.user.id : doc.user)
  if (alreadyHasUser || !doc.email) return

  try {
    const userResult = await payload.find({
      collection: 'users',
      where: { email: { equals: doc.email } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    if (userResult.docs.length === 0) return

    const userId = userResult.docs[0].id

    const updateData: any = { user: userId }

    // web-orders has a customerType field; app-orders does not
    if (doc.customerType !== undefined) {
      updateData.customerType = 'user'
    }

    await payload.update({
      collection: collection as any,
      id: doc.id,
      data: updateData,
      overrideAccess: true,
      depth: 0,
    })

    console.log(`✅ [linkGuestToUser] Linked ${collection} order ${doc.id} to user ${userId}`)
  } catch (error) {
    console.error(`[linkGuestToUser] Error linking order ${doc.id} in ${collection}:`, error)
  }
}
