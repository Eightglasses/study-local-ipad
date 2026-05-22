import { Router } from 'express'
import { getDb } from '../db.js'
import { success, fail } from '../utils/response.js'
import crypto from 'crypto'

const router = Router()

function genId(): string {
  return Date.now().toString(36) + crypto.randomBytes(4).toString('hex')
}

// GET /api/points - total points
router.get('/', (req, res) => {
  const db = getDb()
  const result: any = db
    .prepare("SELECT COALESCE(SUM(CASE WHEN type='earn' THEN points ELSE 0 END), 0) as earned, COALESCE(SUM(CASE WHEN type='redeem' THEN points ELSE 0 END), 0) as redeemed, COALESCE(SUM(CASE WHEN type='deduct' THEN points ELSE 0 END), 0) as deducted FROM points_log WHERE user_id = ?")
    .get(req.userId)
  success(res, {
    total: result.earned - result.redeemed - result.deducted,
    earned: result.earned,
    redeemed: result.redeemed,
  })
})

// GET /api/points/log
router.get('/log', (req, res) => {
  const db = getDb()
  const rows = db
    .prepare('SELECT * FROM points_log WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.userId)
  success(res, rows.map(mapPointsLog))
})

// GET /api/redeems
router.get('/redeems', (req, res) => {
  const db = getDb()
  const rows = db
    .prepare('SELECT * FROM redeems WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.userId)
  success(res, rows.map(mapRedeem))
})

// POST /api/redeem
router.post('/redeem', (req, res) => {
  const db = getDb()
  const { rewardId } = req.body

  if (!rewardId) {
    fail(res, 'rewardId 不能为空', 400)
    return
  }

  const reward: any = db.prepare('SELECT * FROM rewards WHERE id = ? AND user_id = ?').get(rewardId, req.userId)
  if (!reward) {
    fail(res, '奖励不存在', 404)
    return
  }

  const points: any = db
    .prepare("SELECT COALESCE(SUM(CASE WHEN type='earn' THEN points WHEN type='redeem' OR type='deduct' THEN -points ELSE 0 END), 0) as total FROM points_log WHERE user_id = ?")
    .get(req.userId)

  if (points.total < reward.points) {
    fail(res, '积分不足', 400)
    return
  }

  const id = genId()
  const createdAt = Date.now()

  db.prepare(`
    INSERT INTO redeems (id, user_id, reward_id, reward_name, reward_icon, points, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.userId, rewardId, reward.name, reward.icon, reward.points, createdAt)

  db.prepare(`
    INSERT INTO points_log (id, user_id, type, points, description, created_at)
    VALUES (?, ?, 'redeem', ?, ?, ?)
  `).run(genId(), req.userId, reward.points, `${reward.icon} ${reward.name}`, createdAt)

  const row = db.prepare('SELECT * FROM redeems WHERE id = ? AND user_id = ?').get(id, req.userId)
  success(res, mapRedeem(row), '兑换成功')
})

// POST /api/points/deduct
router.post('/deduct', (req, res) => {
  const db = getDb()
  const { points, reason } = req.body

  if (!points || points <= 0) {
    fail(res, '扣分分值必须大于0', 400)
    return
  }

  const id = genId()
  const createdAt = Date.now()
  const description = reason || '表现扣分'

  db.prepare(`
    INSERT INTO points_log (id, user_id, type, points, description, created_at)
    VALUES (?, ?, 'deduct', ?, ?, ?)
  `).run(id, req.userId, points, description, createdAt)

  const row = db.prepare('SELECT * FROM points_log WHERE id = ? AND user_id = ?').get(id, req.userId)
  success(res, mapPointsLog(row), '扣分成功')
})

function mapPointsLog(row: any) {
  return {
    id: row.id,
    type: row.type,
    points: row.points,
    description: row.description,
    createdAt: row.created_at,
  }
}

function mapRedeem(row: any) {
  if (!row) return null
  return {
    id: row.id,
    rewardId: row.reward_id,
    rewardName: row.reward_name,
    rewardIcon: row.reward_icon,
    points: row.points,
    createdAt: row.created_at,
  }
}

export default router
