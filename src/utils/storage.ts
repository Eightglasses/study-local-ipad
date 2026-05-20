/**
 * 数据层 - 统一通过 API 访问服务器数据
 * 全部改为 async，页面中使用 await 调用
 */

import type { Task, CheckIn, Reward, RedeemRecord, PointsLog } from './types'
import {
  fetchAllTasks,
  fetchTodayTasks,
  fetchCompletedIds,
  createTask as apiCreateTask,
  updateTaskById,
  deleteTaskById,
  fetchAllCheckIns,
  createCheckIn as apiCreateCheckIn,
  createCheckInWithImage,
  deleteCheckInById,
  fetchAllRewards,
  createReward as apiCreateReward,
  updateRewardById as apiUpdateReward,
  deleteRewardById as apiDeleteReward,
  fetchPoints,
  fetchPointsLog,
  fetchRedeems,
  createRedeem,
} from './api'

// ========== Tasks ==========

export async function getTasks(): Promise<Task[]> {
  return fetchAllTasks()
}

export async function addTask(task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
  return apiCreateTask(task)
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
  await updateTaskById(id, updates)
}

export async function deleteTask(id: string): Promise<void> {
  await deleteTaskById(id)
}

export async function getTodayTasks(): Promise<Task[]> {
  return fetchTodayTasks()
}

export async function getCompletedTodayTaskIds(): Promise<string[]> {
  return fetchCompletedIds()
}

// ========== CheckIns ==========

export async function getCheckIns(): Promise<CheckIn[]> {
  return fetchAllCheckIns()
}

export async function checkIn(taskId: string, tempFilePath?: string): Promise<CheckIn | null> {
  try {
    if (tempFilePath) {
      return await createCheckInWithImage(taskId, tempFilePath)
    }
    return await apiCreateCheckIn(taskId)
  } catch (e: any) {
    if (e?.statusCode === 409) return null
    throw e
  }
}

export async function deleteCheckIn(id: string): Promise<void> {
  await deleteCheckInById(id)
}

// ========== Rewards ==========

export async function getRewards(): Promise<Reward[]> {
  return fetchAllRewards()
}

export async function addReward(reward: Omit<Reward, 'id' | 'createdAt'>): Promise<Reward> {
  return apiCreateReward(reward)
}

export async function updateReward(id: string, updates: Partial<Reward>): Promise<void> {
  await apiUpdateReward(id, updates)
}

export async function deleteReward(id: string): Promise<void> {
  await apiDeleteReward(id)
}

// ========== Points & Redeem ==========

let pointsCache = { total: 0, earned: 0, redeemed: 0 }

export async function getTotalPoints(): Promise<number> {
  pointsCache = await fetchPoints()
  return pointsCache.total
}

export async function getPointsLog(): Promise<PointsLog[]> {
  return fetchPointsLog()
}

export async function getRedeemRecords(): Promise<RedeemRecord[]> {
  return fetchRedeems()
}

export async function redeemReward(rewardId: string): Promise<RedeemRecord | null> {
  try {
    return await createRedeem(rewardId)
  } catch {
    return null
  }
}

// ========== Computed helpers (remain on client side) ==========

export function repeatLabel(task: Task): string {
  const dayNames = ['日', '一', '二', '三', '四', '五', '六']
  if (task.repeat === 'daily') return '每天'
  if (task.repeat === 'weekly') {
    return (task.weekDays || []).map(d => '周' + dayNames[d]).join('、')
  }
  return '仅一次'
}

// ========== Preset Data ==========

export const PRESET_TASKS = [
  { name: '练琴', icon: '🎹', points: 10, repeat: 'daily' as const },
  { name: '阅读', icon: '📖', points: 10, repeat: 'daily' as const },
  { name: '运动', icon: '🏃', points: 10, repeat: 'daily' as const },
  { name: '扫地', icon: '🧹', points: 2, repeat: 'daily' as const },
  { name: '做家务', icon: '🧽', points: 15, repeat: 'weekly' as const, weekDays: [6, 0] },
  { name: '早睡', icon: '🌙', points: 5, repeat: 'daily' as const },
  { name: '完成作业', icon: '📝', points: 10, repeat: 'daily' as const },
  { name: '背单词', icon: '🔤', points: 8, repeat: 'daily' as const },
  { name: '画画', icon: '🎨', points: 10, repeat: 'weekly' as const, weekDays: [1, 3, 5] },
]

export const PRESET_REWARDS = [
  { name: '1元零花钱', icon: '💰', points: 10 },
  { name: '看30分钟电视', icon: '📺', points: 50 },
  { name: '吃冰淇淋', icon: '🍦', points: 30 },
  { name: '玩30分钟游戏', icon: '🎮', points: 80 },
  { name: '买一本课外书', icon: '📚', points: 100 },
  { name: '买一个小玩具', icon: '🧸', points: 200 },
  { name: '周末出游', icon: '🎠', points: 500 },
]
