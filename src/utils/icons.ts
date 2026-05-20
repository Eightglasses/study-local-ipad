/**
 * 图标库 - 统一管理可选图标，按分类编排
 */

export interface IconGroup {
    name: string
    icons: string[]
}

export const ICON_LIBRARY: IconGroup[] = [
    {
        name: '学习',
        icons: ['📝', '📖', '📚', '✏️', '📐', '🔬', '🧮', '📓', '🖊️', '🎒', '🧪', '📏'],
    },
    {
        name: '运动',
        icons: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏓', '🏸', '🏊', '🚴', '🧘', '🤸', '🏃'],
    },
    {
        name: '艺术',
        icons: ['🎨', '🎵', '🎹', '🎸', '🎺', '🎻', '🥁', '🎤', '🎭', '🩰', '🧵', '🎬'],
    },
    {
        name: '生活',
        icons: ['🧹', '🛏️', '🍳', '🧺', '🪴', '🛒', '🐾', '🧸', '🦮', '🚿', '🗑️', '🪥'],
    },
    {
        name: '奖励',
        icons: ['🎁', '⭐', '🌟', '🏆', '💎', '💰', '🍰', '🍦', '🍕', '🎮', '🎯', '🎪'],
    },
    {
        name: '习惯',
        icons: ['⏰', '🌅', '🌙', '💧', '🍎', '💊', '🧴', '🪞', '📵', '🚰', '😴', '🌿'],
    },
    {
        name: '常用',
        icons: ['❤️', '👍', '🔥', '✨', '💪', '🎉', '🌈', '🌸', '🦋', '🌻', '☀️', '💡'],
    },
]

/** 所有图标的扁平列表 */
export const ALL_ICONS: string[] = ICON_LIBRARY.flatMap(g => g.icons)

/** 默认任务图标 */
export const DEFAULT_TASK_ICON = '⭐'

/** 默认奖励图标 */
export const DEFAULT_REWARD_ICON = '🎁'
