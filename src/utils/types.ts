export interface Task {
  id: string
  name: string
  icon: string
  points: number
  repeat: 'daily' | 'weekly' | 'once'
  weekDays?: number[]
  active: boolean
  createdAt: number
}

export interface CheckIn {
  id: string
  taskId: string
  taskName: string
  taskIcon: string
  date: string
  points: number
  imageUrl?: string
  device?: string
  createdAt: number
}

export interface Reward {
  id: string
  name: string
  icon: string
  points: number
  active: boolean
  createdAt: number
}

export interface RedeemRecord {
  id: string
  rewardId: string
  rewardName: string
  rewardIcon: string
  points: number
  createdAt: number
}

export interface PointsLog {
  id: string
  type: 'earn' | 'redeem' | 'deduct'
  points: number
  description: string
  createdAt: number
}
