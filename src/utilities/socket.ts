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
