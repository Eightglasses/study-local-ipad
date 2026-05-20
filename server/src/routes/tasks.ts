import { Router } from 'express'
import { getDb } from '../db.js'
import { success, fail } from '../utils/response.js'
import crypto from 'crypto'

const router = Router()

function genId(): string {
    return Date.now().toString(36) + crypto.randomBytes(4).toString('hex')
}

// GET /api/tasks
router.get('/', (req, res) => {
    const db = getDb()
    const rows = db.prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at ASC').all(req.userId)
    success(res, rows.map(mapTask))
})

// GET /api/tasks/today - today's pending tasks
router.get('/today', (req, res) => {
    const db = getDb()
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const dayOfWeek = today.getDay()

    const doneIds = db
        .prepare("SELECT task_id FROM checkins WHERE date = ? AND user_id = ?")
        .all(todayStr, req.userId)
        .map((r: any) => r.task_id)

    const allTasks = db.prepare('SELECT * FROM tasks WHERE active = 1 AND user_id = ?').all(req.userId)

    const pending = allTasks.filter((t: any) => {
        if (doneIds.includes(t.id)) return false
        if (t.repeat_text === 'daily') return true
        if (t.repeat_text === 'weekly') {
            const days: number[] = t.week_days ? JSON.parse(t.week_days) : []
            return days.includes(dayOfWeek)
        }
        if (t.repeat_text === 'once') return true
        return false
    })

    success(res, pending.map(mapTask))
})

// GET /api/tasks/completed-ids
router.get('/completed-ids', (req, res) => {
    const db = getDb()
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const rows = db
        .prepare("SELECT task_id FROM checkins WHERE date = ? AND user_id = ?")
        .all(todayStr, req.userId)
    success(res, rows.map((r: any) => r.task_id))
})

// POST /api/tasks
router.post('/', (req, res) => {
    const db = getDb()
    const { name, icon, points, repeat, weekDays, active } = req.body

    if (!name) {
        fail(res, '任务名称不能为空', 400)
        return
    }

    const id = genId()
    const createdAt = Date.now()

    db.prepare(`
    INSERT INTO tasks (id, user_id, name, icon, points, repeat_text, week_days, active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.userId, name, icon || '⭐', points, repeat || 'daily', weekDays ? JSON.stringify(weekDays) : null, active !== false ? 1 : 0, createdAt)

    const row = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(id, req.userId)
    success(res, mapTask(row), '创建成功')
})

// PUT /api/tasks/:id
router.put('/:id', (req, res) => {
    const db = getDb()
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.userId)
    if (!existing) {
        fail(res, '任务不存在', 404)
        return
    }

    const { name, icon, points, repeat, weekDays, active } = req.body
    const updates: string[] = []
    const params: any[] = []

    if (name !== undefined) { updates.push('name = ?'); params.push(name) }
    if (icon !== undefined) { updates.push('icon = ?'); params.push(icon) }
    if (points !== undefined) { updates.push('points = ?'); params.push(points) }
    if (repeat !== undefined) { updates.push('repeat_text = ?'); params.push(repeat) }
    if (weekDays !== undefined) { updates.push('week_days = ?'); params.push(JSON.stringify(weekDays)) }
    if (active !== undefined) { updates.push('active = ?'); params.push(active ? 1 : 0) }

    if (updates.length > 0) {
        params.push(req.params.id)
        params.push(req.userId)
        db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...params)
    }

    const row = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.userId)
    success(res, mapTask(row), '更新成功')
})

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
    const db = getDb()
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.userId)
    if (!existing) {
        fail(res, '任务不存在', 404)
        return
    }
    db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(req.params.id, req.userId)
    success(res, null, '删除成功')
})

function mapTask(row: any) {
    if (!row) return null
    return {
        id: row.id,
        name: row.name,
        icon: row.icon,
        points: row.points,
        repeat: row.repeat_text,
        weekDays: row.week_days ? JSON.parse(row.week_days) : undefined,
        active: !!row.active,
        createdAt: row.created_at,
    }
}

export default router
