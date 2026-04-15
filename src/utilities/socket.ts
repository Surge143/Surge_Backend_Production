import { Server } from 'socket.io'

export const getIO = (): Server | null => {
  return (globalThis as any).io || null
}

export const emitOrderCreated = (order: any) => {
  const io = getIO()
  if (io) {
    console.log('[Socket.IO] Emitting order-created, orderId:', order?.id)
    io.emit('order-created', order)
  } else {
    console.warn('[Socket.IO] ⚠️ global io not found — order-created NOT emitted')
  }
}

export const emitOrderUpdated = (order: any) => {
  const io = getIO()
  if (io) {
    console.log('[Socket.IO] Emitting order-updated, orderId:', order?.id)
    io.emit('order-updated', order)
  } else {
    console.warn('[Socket.IO] ⚠️ global io not found — order-updated NOT emitted')
  }
}

export const emitSlotUpdated = (slot: any) => {
  const io = getIO()
  if (io) {
    io.emit('slot-updated', slot)
  }
}

export const emitShopStatusUpdated = (shop: any) => {
  const io = getIO()
  if (io) {
    io.emit('shop-status-updated', shop)
  }
}

export const emitWebOrderCreated = (order: any) => {
  const io = getIO()
  if (io) {
    console.log('[Socket.IO] Emitting web-order-created, orderId:', order?.id)
    io.emit('web-order-created', order)
  } else {
    console.warn('[Socket.IO] ⚠️ global io not found — web-order-created NOT emitted')
  }
}

export const emitWebOrderUpdated = (order: any) => {
  const io = getIO()
  if (io) {
    console.log('[Socket.IO] Emitting web-order-updated, orderId:', order?.id)
    io.emit('web-order-updated', order)
  } else {
    console.warn('[Socket.IO] ⚠️ global io not found — web-order-updated NOT emitted')
  }
}
