import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { fail } from '../utils/response.js'

const JWT_SECRET = process.env.JWT_SECRET || 'checkin-app-secret-key-2024'

export interface JwtPayload {
    userId: string
    username: string
}

/** 扩展 Express Request，注入 userId */
declare global {
    namespace Express {
        interface Request {
            userId?: string
            username?: string
        }
    }
}

/** JWT 认证中间件 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        fail(res, '请先登录', 401)
        return
    }

    try {
        const token = authHeader.split(' ')[1]
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
        req.userId = decoded.userId
        req.username = decoded.username
        next()
    } catch {
        fail(res, '登录已过期，请重新登录', 401)
    }
}

/** 签发 token（7 天有效期） */
export function signToken(userId: string, username: string): string {
    return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' })
}
