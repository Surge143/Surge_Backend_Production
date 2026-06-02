import { Payload } from 'payload'

/**
 * When payment is completed, check if the order belongs to a guest whose email matches
 * an existing user account. If so, link the order to that user.
 *
 * IMPORTANT: This only runs on payment completion (update to paidStatus), NOT on create.
 * Running on create causes a race condition with the Stripe webhook: both the create-time
 * linking update and the webhook's paymentStatus update write to the same document
 * concurrently, and the linking update can overwrite paymentStatus back to 'pending'.
 *
 * @param paidStatus - The value of paymentStatus that represents a completed payment
 *                     ('completed' for web-orders, 'paid' for app-orders)
 */
export const linkGuestOrderToUser = async ({
  payload,
  doc,
  previousDoc,
  collection,
  paidStatus,
}: {
  payload: Payload
  doc: any
  previousDoc: any
  operation?: string   // kept in signature for backwards compatibility — no longer used
  collection: string
  paidStatus: string
}): Promise<void> => {
  // Only fire when payment JUST transitioned to the paid status on an update.
  // Do NOT run on 'create' — the order is always created as 'pending', and
  // running here at creation races with the Stripe webhook's status update.
  const isNowPaid = doc.paymentStatus === paidStatus
  const wasPreviouslyPaid = previousDoc?.paymentStatus === paidStatus

  if (!isNowPaid || wasPreviouslyPaid) return

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

