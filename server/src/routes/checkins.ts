import { Router } from 'express'
import { getDb } from '../db.js'
import { success, fail } from '../utils/response.js'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads')

if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true })
}

const router = Router()

function genId(): string {
    return Date.now().toString(36) + crypto.randomBytes(4).toString('hex')
}

// GET /api/checkins
router.get('/', (req, res) => {
    const db = getDb()
    const rows = db
        .prepare('SELECT * FROM checkins WHERE user_id = ? ORDER BY created_at DESC')
        .all(req.userId)
    success(res, rows.map(mapCheckIn))
})

// POST /api/checkins - with optional image
router.post('/', (req, res) => {
    const db = getDb()
    const taskId = req.body.taskId || req.body.task_id
    const file = (req as any).file

    if (!taskId) {
        fail(res, 'taskId 不能为空', 400)
        return
    }

    const task: any = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(taskId, req.userId)
    if (!task) {
        fail(res, '任务不存在', 404)
        return
    }

    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    const existing = db
        .prepare('SELECT id FROM checkins WHERE task_id = ? AND date = ? AND user_id = ?')
        .get(taskId, dateStr, req.userId)

    if (existing) {
        fail(res, '今日已打卡', 409)
        return
    }

    const id = genId()
    const createdAt = Date.now()

    let imagePath: string | null = null
    if (file) {
        const ext = path.extname(file.originalname) || '.jpg'
        const filename = `${id}${ext}`
        const destPath = path.join(UPLOADS_DIR, filename)
        fs.renameSync(file.path, destPath)
        imagePath = filename
    }

    db.prepare(`
    INSERT INTO checkins (id, user_id, task_id, task_name, task_icon, date, points, image_path, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.userId, taskId, task.name, task.icon, dateStr, task.points, imagePath, createdAt)

    addPointsLog(db, req.userId!, task.points, `${task.icon} ${task.name}`)

    const row = db.prepare('SELECT * FROM checkins WHERE id = ? AND user_id = ?').get(id, req.userId)
    success(res, mapCheckIn(row), '打卡成功')
})

// DELETE /api/checkins/:id
router.delete('/:id', (req, res) => {
    const db = getDb()
    const checkin: any = db.prepare('SELECT * FROM checkins WHERE id = ? AND user_id = ?').get(req.params.id, req.userId)

    if (!checkin) {
        fail(res, '记录不存在', 404)
        return
    }

    if (checkin.image_path) {
        const filePath = path.join(UPLOADS_DIR, checkin.image_path)
        try { fs.unlinkSync(filePath) } catch { /* ignore */ }
    }

    db.prepare('DELETE FROM checkins WHERE id = ? AND user_id = ?').run(req.params.id, req.userId)

    db.prepare('DELETE FROM points_log WHERE description = ? AND points = ? AND type = ? AND user_id = ?')
        .run(`${checkin.task_icon} ${checkin.task_name}`, checkin.points, 'earn', req.userId)

    success(res, null, '删除成功')
})

function addPointsLog(db: any, userId: string, points: number, description: string) {
    db.prepare(`
    INSERT INTO points_log (id, user_id, type, points, description, created_at)
    VALUES (?, ?, 'earn', ?, ?, ?)
  `).run(genId(), userId, points, description, Date.now())
}

function mapCheckIn(row: any) {
    if (!row) return null
    return {
        id: row.id,
        taskId: row.task_id,
        taskName: row.task_name,
        taskIcon: row.task_icon,
        date: row.date,
        points: row.points,
        imageUrl: row.image_path ? `/api/images/${row.image_path}` : undefined,
        createdAt: row.created_at,
    }
}

export default router
