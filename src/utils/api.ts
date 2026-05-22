import type { Task, CheckIn, Reward, RedeemRecord, PointsLog } from './types'
import { getToken } from './auth'

const BASE = '/api'

/** 标准响应格式 */
interface ApiResponse<T = any> {
    code: number
    data: T
    message: string
}

function request<T>(options: UniApp.RequestOptions): Promise<T> {
    const token = getToken()
    const header: any = { ...(options.header || {}) }
    if (token) {
        header['Authorization'] = `Bearer ${token}`
    }
    return new Promise((resolve, reject) => {
        uni.request({
            ...options,
            url: `${BASE}${options.url}`,
            header,
            success: (res) => {
                const body = res.data as ApiResponse<T>
                if (body.code === 0) {
                    resolve(body.data)
                } else {
                    uni.showToast({ title: body.message || '请求失败', icon: 'none' })
                    reject(new Error(body.message))
                }
            },
            fail: reject,
        })
    })
}

function uploadFile<T>(options: {
    url: string
    filePath: string
    name: string
    formData?: Record<string, string>
}): Promise<T> {
    const token = getToken()
    const header: any = {}
    if (token) {
        header['Authorization'] = `Bearer ${token}`
    }
    return new Promise((resolve, reject) => {
        uni.uploadFile({
            url: `${BASE}${options.url}`,
            filePath: options.filePath,
            name: options.name,
            formData: options.formData,
            header,
            success: (res) => {
                try {
                    const body = JSON.parse(res.data as string) as ApiResponse<T>
                    if (body.code === 0) {
                        resolve(body.data)
                    } else {
                        uni.showToast({ title: body.message || '上传失败', icon: 'none' })
                        reject(new Error(body.message))
                    }
                } catch {
                    reject(new Error('解析响应失败'))
                }
            },
            fail: reject,
        })
    })
}

// ===== Tasks =====

export function fetchAllTasks(): Promise<Task[]> {
    return request({ url: '/tasks', method: 'GET' })
}

export function fetchTodayTasks(): Promise<Task[]> {
    return request({ url: '/tasks/today', method: 'GET' })
}

export function fetchCompletedIds(): Promise<string[]> {
    return request({ url: '/tasks/completed-ids', method: 'GET' })
}

export function createTask(data: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    return request({ url: '/tasks', method: 'POST', data })
}

export function updateTaskById(id: string, data: Partial<Task>): Promise<Task> {
    return request({ url: `/tasks/${id}`, method: 'PUT', data })
}

export function deleteTaskById(id: string): Promise<{ success: boolean }> {
    return request({ url: `/tasks/${id}`, method: 'DELETE' })
}

// ===== CheckIns =====

export function fetchAllCheckIns(): Promise<CheckIn[]> {
    return request({ url: '/checkins', method: 'GET' })
}

export function createCheckIn(taskId: string): Promise<CheckIn> {
    const info = uni.getSystemInfoSync()
    const device = `${info.brand || ''} ${info.model || ''} (${info.platform || ''})`.trim()
    return request({ url: '/checkins', method: 'POST', data: { taskId, device } })
}

export function createCheckInWithImage(taskId: string, filePath: string): Promise<CheckIn> {
    const info = uni.getSystemInfoSync()
    const device = `${info.brand || ''} ${info.model || ''} (${info.platform || ''})`.trim()
    return uploadFile({
        url: '/checkins',
        filePath,
        name: 'image',
        formData: { taskId, device },
    })
}

export function deleteCheckInById(id: string): Promise<{ success: boolean }> {
    return request({ url: `/checkins/${id}`, method: 'DELETE' })
}

// ===== Rewards =====

export function fetchAllRewards(): Promise<Reward[]> {
    return request({ url: '/rewards', method: 'GET' })
}

export function createReward(data: Omit<Reward, 'id' | 'createdAt'>): Promise<Reward> {
    return request({ url: '/rewards', method: 'POST', data })
}

export function updateRewardById(id: string, data: Partial<Reward>): Promise<Reward> {
    return request({ url: `/rewards/${id}`, method: 'PUT', data })
}

export function deleteRewardById(id: string): Promise<{ success: boolean }> {
    return request({ url: `/rewards/${id}`, method: 'DELETE' })
}

// ===== Points & Redeem =====

export function fetchPoints(): Promise<{ total: number; earned: number; redeemed: number }> {
    return request({ url: '/points', method: 'GET' })
}

export function fetchPointsLog(): Promise<PointsLog[]> {
    return request({ url: '/points/log', method: 'GET' })
}

export function fetchRedeems(): Promise<RedeemRecord[]> {
    return request({ url: '/points/redeems', method: 'GET' })
}

export function createRedeem(rewardId: string): Promise<RedeemRecord> {
    return request({ url: '/redeem', method: 'POST', data: { rewardId } })
}

// ===== Deduct Points =====

export function deductPoints(points: number, reason: string): Promise<PointsLog> {
    return request({ url: '/points/deduct', method: 'POST', data: { points, reason } })
}
