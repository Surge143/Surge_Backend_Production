import { Server } from 'socket.io'

export const getIO = (): Server | null => {
  // @ts-ignore
  return global.io || null
}

export const emitOrderCreated = (order: any) => {
  const io = getIO()
  if (io) {
    console.log('Emitting order-created via Socket.io')
    io.emit('order-created', order)
  } else {
    console.warn('Socket.io instance not found on global object')
  }
}

export const emitOrderUpdated = (order: any) => {
  const io = getIO()
  if (io) {
    console.log('Emitting order-updated via Socket.io')
    io.emit('order-updated', order)
  } else {
    console.warn('Socket.io instance not found on global object')
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

export const emitWebOrderUpdated = (order: any) => {
  const io = getIO()
  if (io) {
    console.log('Emitting web-order-updated via Socket.io')
    io.emit('web-order-updated', order)
  } else {
    console.warn('Socket.io instance not found on global object')
  }
}
