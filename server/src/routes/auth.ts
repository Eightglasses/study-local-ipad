import { Router } from 'express'
import crypto from 'crypto'
import { getDb } from '../db.js'
import { success, fail } from '../utils/response.js'
import { signToken } from '../middleware/auth.js'

const router = Router()

function genId(): string {
    return Date.now().toString(36) + crypto.randomBytes(4).toString('hex')
}

/** 密码哈希 */
function hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex')
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
    return `${salt}:${hash}`
}

/** 验证密码 */
function verifyPassword(password: string, stored: string): boolean {
    const [salt, hash] = stored.split(':')
    const attempt = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
    return hash === attempt
}

// POST /api/auth/register
router.post('/register', (req, res) => {
    const db = getDb()
    const { username, password } = req.body

    if (!username || !password) {
        fail(res, '用户名和密码不能为空', 400)
        return
    }

    if (username.length < 2 || username.length > 20) {
        fail(res, '用户名长度需在 2-20 个字符', 400)
        return
    }

    // 检查用户名是否已存在
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
    if (existing) {
        fail(res, '用户名已存在', 409)
        return
    }

    if (password.length < 4) {
        fail(res, '密码至少 4 位', 400)
        return
    }

    const id = genId()
    const createdAt = Date.now()
    const passwordHash = hashPassword(password)

    db.prepare(`
    INSERT INTO users (id, username, password_hash, created_at)
    VALUES (?, ?, ?, ?)
  `).run(id, username, passwordHash, createdAt)

    const token = signToken(id, username)

    success(res, {
        token,
        user: { id, username },
    }, '注册成功')
})

// POST /api/auth/login
router.post('/login', (req, res) => {
    const db = getDb()
    const { username, password } = req.body

    if (!username || !password) {
        fail(res, '用户名和密码不能为空', 400)
        return
    }

    const user: any = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
    if (!user) {
        fail(res, '用户名或密码错误', 401)
        return
    }

    if (!verifyPassword(password, user.password_hash)) {
        fail(res, '用户名或密码错误', 401)
        return
    }

    const token = signToken(user.id, user.username)

    success(res, {
        token,
        user: { id: user.id, username: user.username },
    }, '登录成功')
})

// PUT /api/auth/password
router.put('/password', (req, res) => {
    const db = getDb()
    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
        fail(res, '请输入旧密码和新密码', 400)
        return
    }

    if (newPassword.length < 4) {
        fail(res, '新密码至少 4 位', 400)
        return
    }

    const user: any = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId)
    if (!user) {
        fail(res, '用户不存在', 404)
        return
    }

    if (!verifyPassword(oldPassword, user.password_hash)) {
        fail(res, '旧密码错误', 401)
        return
    }

    const newHash = hashPassword(newPassword)
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.userId)

    success(res, null, '密码修改成功')
})

export default router
