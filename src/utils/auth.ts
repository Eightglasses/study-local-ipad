/**
 * 认证模块 - token 管理 + 登录/注册 API
 */

const TOKEN_KEY = 'checkin_token'
const USER_KEY = 'checkin_user'

export interface AuthUser {
    id: string
    username: string
}

interface AuthResponse {
    token: string
    user: AuthUser
}

/** 获取存储的 token */
export function getToken(): string | null {
    return uni.getStorageSync(TOKEN_KEY) || null
}

/** 获取当前用户信息 */
export function getUser(): AuthUser | null {
    const raw = uni.getStorageSync(USER_KEY)
    return raw || null
}

/** 是否已登录 */
export function isLoggedIn(): boolean {
    return !!getToken()
}

/** 保存登录状态 */
function saveAuth(token: string, user: AuthUser) {
    uni.setStorageSync(TOKEN_KEY, token)
    uni.setStorageSync(USER_KEY, user)
}

/** 清除登录状态 */
export function logout() {
    uni.removeStorageSync(TOKEN_KEY)
    uni.removeStorageSync(USER_KEY)
}

/** 注册 */
export async function register(username: string, password: string): Promise<AuthResponse> {
    return new Promise((resolve, reject) => {
        uni.request({
            url: '/api/auth/register',
            method: 'POST',
            data: { username, password },
            success: (res: any) => {
                const body = res.data
                if (body.code === 0) {
                    saveAuth(body.data.token, body.data.user)
                    resolve(body.data)
                } else {
                    uni.showToast({ title: body.message || '注册失败', icon: 'none' })
                    reject(new Error(body.message))
                }
            },
            fail: reject,
        })
    })
}

/** 登录 */
export async function login(username: string, password: string): Promise<AuthResponse> {
    return new Promise((resolve, reject) => {
        uni.request({
            url: '/api/auth/login',
            method: 'POST',
            data: { username, password },
            success: (res: any) => {
                const body = res.data
                if (body.code === 0) {
                    saveAuth(body.data.token, body.data.user)
                    resolve(body.data)
                } else {
                    uni.showToast({ title: body.message || '登录失败', icon: 'none' })
                    reject(new Error(body.message))
                }
            },
            fail: reject,
        })
    })
}
