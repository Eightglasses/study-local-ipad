import initSqlJs, { Database as SqlJsDb } from 'sql.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '..', 'data', 'checkin.db')

let db: SqlJsDb

// Wrapper to make sql.js work like better-sqlite3
class StatementWrapper {
    private stmt: any
    constructor(stmt: any) {
        this.stmt = stmt
    }
    get(...params: any[]) {
        if (params.length > 0) this.stmt.bind(params)
        if (this.stmt.step()) {
            const row = this.stmt.getAsObject()
            this.stmt.reset()
            return row
        }
        this.stmt.reset()
        return undefined
    }
    all(...params: any[]) {
        if (params.length > 0) this.stmt.bind(params)
        const rows: any[] = []
        while (this.stmt.step()) {
            rows.push(this.stmt.getAsObject())
        }
        this.stmt.reset()
        return rows
    }
    run(...params: any[]) {
        if (params.length > 0) this.stmt.bind(params)
        this.stmt.step()
        this.stmt.reset()
    }
}

export async function initDb(): Promise<void> {
    const dir = path.dirname(DB_PATH)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }

    const SQL = await initSqlJs()

    if (fs.existsSync(DB_PATH)) {
        const buffer = fs.readFileSync(DB_PATH)
        db = new SQL.Database(buffer)
    } else {
        db = new SQL.Database()
    }

    db.run('PRAGMA journal_mode=WAL')
    initSchema()
    migrate()
    saveDb()
}

function saveDb() {
    const data = db.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(DB_PATH, buffer)
}

function initSchema() {
    // 用户表
    db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `)

    // 任务表
    db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '⭐',
      points INTEGER NOT NULL DEFAULT 10,
      repeat_text TEXT NOT NULL DEFAULT 'daily',
      week_days TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    )
  `)

    // 打卡记录表
    db.run(`
    CREATE TABLE IF NOT EXISTS checkins (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      task_id TEXT NOT NULL,
      task_name TEXT NOT NULL,
      task_icon TEXT NOT NULL,
      date TEXT NOT NULL,
      points INTEGER NOT NULL,
      image_path TEXT,
      created_at INTEGER NOT NULL
    )
  `)

    // 奖励表
    db.run(`
    CREATE TABLE IF NOT EXISTS rewards (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '🎁',
      points INTEGER NOT NULL DEFAULT 50,
      active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    )
  `)

    // 兑换记录表
    db.run(`
    CREATE TABLE IF NOT EXISTS redeems (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      reward_id TEXT NOT NULL,
      reward_name TEXT NOT NULL,
      reward_icon TEXT NOT NULL,
      points INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )
  `)

    // 积分日志表
    db.run(`
    CREATE TABLE IF NOT EXISTS points_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      points INTEGER NOT NULL,
      description TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `)
}

/** 数据库迁移：为旧表添加 user_id 列 */
function migrate() {
    const tables = ['tasks', 'checkins', 'rewards', 'redeems', 'points_log']

    for (const table of tables) {
        const rows = db.exec(`PRAGMA table_info(${table})`)
        const cols = rows.length > 0 ? rows[0].values.map((r: any) => r[1]) : []
        if (!cols.includes('user_id')) {
            db.run(`ALTER TABLE ${table} ADD COLUMN user_id TEXT`)
        }
    }
}

export function getDb() {
    if (!db) throw new Error('Database not initialized. Call initDb() first.')
    return {
        prepare: (sql: string) => {
            const stmt = db.prepare(sql)
            return new StatementWrapper(stmt)
        },
        exec: (sql: string) => db.exec(sql),
        run: (sql: string, params?: any[]) => {
            db.run(sql, params)
            saveDb()
            return { changes: db.getRowsModified() }
        },
        save: () => saveDb(),
    }
}

export default getDb
