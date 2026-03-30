process.env.TZ = 'Asia/Dubai'
import { createServer } from 'http'
import next from 'next'
import { Server } from 'socket.io'
import { parse } from 'url'
import { Cron } from 'croner'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    // Socket.IO handles its own /socket.io/* requests via its own listener.
    // If we let Next.js handle them it will return 404 and claim the response
    // before Socket.IO can write to it.
    if (parsedUrl.pathname?.startsWith('/socket.io')) return
    handle(req, res, parsedUrl)
  })

  // Build the allowed origins list — always include the server's own origin
  // so the admin dashboards (served from the same host) can connect.
  const allowedOrigins = [
    `http://localhost:${port}`,
    `https://localhost:${port}`,
    'http://localhost:8100',
    'http://localhost:5173',
    process.env.PAYLOAD_PUBLIC_SERVER_URL || '',
  ].filter(Boolean)

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow all origins to prevent CORS issues during deployment
        callback(null, true)
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  // @ts-ignore
  global.io = io

  io.on('connection', (socket) => {
    console.log('[Socket.IO] Client connected:', socket.id)

    socket.on('disconnect', () => {
      console.log('[Socket.IO] Client disconnected:', socket.id)
    })
  })

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)

    // ── Slot preparation cron — runs every minute ──────────────────
    // Finds accepted+queued orders whose slot time is ≤ 30 min away
    // and automatically moves them to "preparing".
    const cronSecret = process.env.CRON_SECRET || 'slot-cron-internal'
    new Cron('* * * * *', async () => {
      try {
        await fetch(`http://localhost:${port}/api/cron/slot-preparation`, {
          headers: { 'x-cron-secret': cronSecret },
        })
      } catch (err) {
        console.error('[SlotCron] fetch error:', err)
      }
    })
    console.log('[SlotCron] Slot preparation cron started (every minute)')
  })
})
