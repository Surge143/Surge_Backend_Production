import { createServer } from 'http'
import next from 'next'
import { Server } from 'socket.io'
import { parse } from 'url'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
        const parsedUrl = parse(req.url!, true)
        handle(req, res, parsedUrl)
    })

    const io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    })

    // @ts-ignore
    global.io = io

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id)

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id)
        })
    })

    httpServer.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`)
    })
})
