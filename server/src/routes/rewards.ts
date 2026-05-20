import { Router } from 'express'
import { getDb } from '../db.js'
import { success, fail } from '../utils/response.js'
import crypto from 'crypto'

const router = Router()

function genId(): string {
  return Date.now().toString(36) + crypto.randomBytes(4).toString('hex')
}

// GET /api/rewards
router.get('/', (req, res) => {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM rewards WHERE user_id = ? ORDER BY created_at ASC').all(req.userId)
  success(res, rows.map(mapReward))
})

// POST /api/rewards
router.post('/', (req, res) => {
  const db = getDb()
  const { name, icon, points, active } = req.body

  if (!name) {
    fail(res, '奖励名称不能为空', 400)
    return
  }

  const id = genId()
  const createdAt = Date.now()

  db.prepare(`
    INSERT INTO rewards (id, user_id, name, icon, points, active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.userId, name, icon || '🎁', points, active !== false ? 1 : 0, createdAt)

  const row = db.prepare('SELECT * FROM rewards WHERE id = ? AND user_id = ?').get(id, req.userId)
  success(res, mapReward(row), '创建成功')
})

// PUT /api/rewards/:id
router.put('/:id', (req, res) => {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM rewards WHERE id = ? AND user_id = ?').get(req.params.id, req.userId)
  if (!existing) {
    fail(res, '奖励不存在', 404)
    return
  }

  const { name, icon, points, active } = req.body
  const updates: string[] = []
  const params: any[] = []

  if (name !== undefined) { updates.push('name = ?'); params.push(name) }
  if (icon !== undefined) { updates.push('icon = ?'); params.push(icon) }
  if (points !== undefined) { updates.push('points = ?'); params.push(points) }
  if (active !== undefined) { updates.push('active = ?'); params.push(active ? 1 : 0) }

  if (updates.length > 0) {
    params.push(req.params.id)
    params.push(req.userId)
    db.prepare(`UPDATE rewards SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...params)
  }

  const row = db.prepare('SELECT * FROM rewards WHERE id = ? AND user_id = ?').get(req.params.id, req.userId)
  success(res, mapReward(row), '更新成功')
})

// DELETE /api/rewards/:id
router.delete('/:id', (req, res) => {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM rewards WHERE id = ? AND user_id = ?').get(req.params.id, req.userId)
  if (!existing) {
    fail(res, '奖励不存在', 404)
    return
  }
  db.prepare('DELETE FROM rewards WHERE id = ? AND user_id = ?').run(req.params.id, req.userId)
  success(res, null, '删除成功')
})

function mapReward(row: any) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    points: row.points,
    active: !!row.active,
    createdAt: row.created_at,
  }
}

export default router
