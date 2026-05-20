import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

import { initDb } from './db.js'
import { authMiddleware } from './middleware/auth.js'
import authRouter from './routes/auth.js'
import tasksRouter from './routes/tasks.js'
import checkinsRouter from './routes/checkins.js'
import rewardsRouter from './routes/rewards.js'
import pointsRouter from './routes/points.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = process.env.PORT || 3001

// Initialize database on startup
await initDb()

// Middleware
app.use(cors())
app.use(express.json())

// Multer for file uploads (temporary disk storage)
const upload = multer({ dest: path.join(__dirname, '..', 'tmp') })

// Serve uploaded images (public, no auth required)
const uploadsDir = path.join(__dirname, '..', 'uploads')
app.use('/api/images', express.static(uploadsDir))

// Public routes (no auth required)
app.use('/api/auth', authRouter)

// Protected routes (require JWT)
app.use('/api/tasks', authMiddleware, tasksRouter)
app.use('/api/checkins', authMiddleware, upload.single('image'), checkinsRouter)
app.use('/api/rewards', authMiddleware, rewardsRouter)
app.use('/api/points', authMiddleware, pointsRouter)
app.use('/api', authMiddleware, pointsRouter) // for /api/redeem

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', '..', 'dist', 'build', 'h5')
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath))
    // SPA fallback
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'))
    })
  } else {
    console.warn(`[WARN] Frontend dist not found at: ${distPath}`)
    console.warn('[WARN] Run `npm run build` in the project root first.')
  }
}

app.listen(PORT, () => {
  console.log(`✅ Check-in server running at http://localhost:${PORT}`)
})
