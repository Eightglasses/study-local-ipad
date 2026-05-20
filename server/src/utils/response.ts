import { Response } from 'express'

/** 统一响应格式 */
export interface ApiResponse<T = any> {
    code: number
    data: T
    message: string
}

/** 成功响应 */
export function success<T>(res: Response, data: T, message = 'ok', code = 0) {
    const body: ApiResponse<T> = { code, data, message }
    res.json(body)
}

/** 失败响应 */
export function fail(res: Response, message: string, code = 1, status = 200) {
    const body: ApiResponse<null> = { code, data: null, message }
    res.status(status).json(body)
}
