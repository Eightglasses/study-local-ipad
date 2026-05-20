# 🌟 儿童打卡积分

一个家庭多用户的打卡积分应用，适用于 iPad / iPhone / 桌面浏览器。

- 创建日常任务（练琴、阅读、运动...），完成打卡赚积分
- 用积分兑换奖励（看动画片、买零食...）
- **多人独立账号**，每个人看到自己的任务和积分
- 部署到服务器后，全家设备访问同一个网址即可共享

## 技术栈

| 层     | 技术                                            |
| ------ | ----------------------------------------------- |
| 前端   | uni-app 3.0（Vue 3 + TypeScript + Vite）        |
| 后端   | Node.js + Express + TypeScript                  |
| 数据库 | SQLite（sql.js，零配置）                        |
| 认证   | JWT（7 天有效期），密码 PBKDF2/SHA-512 加盐哈希 |
| 图片   | multer 上传到 `server/uploads/`                 |

## 项目结构

```
├── src/                  # uni-app 前端
│   ├── pages/
│   │   ├── login/        # 登录 / 注册
│   │   ├── index/        # 今日打卡主页
│   │   ├── rewards/      # 奖励商城 + 兑换
│   │   ├── history/      # 打卡记录 + 图片详情
│   │   └── settings/     # 任务/奖励管理 + 退出登录
│   └── utils/
│       ├── api.ts        # HTTP 客户端（自动带 JWT）
│       ├── auth.ts       # 登录/注册/token 管理
│       └── storage.ts    # 数据层封装
├── server/               # Node.js 后端
│   ├── src/
│   │   ├── index.ts      # Express 入口（API + 静态文件）
│   │   ├── db.ts         # SQLite 数据库初始化
│   │   ├── middleware/    # JWT 认证中间件
│   │   └── routes/       # tasks / checkins / rewards / points / auth
│   ├── data/             # SQLite 数据库文件（gitignore）
│   └── uploads/          # 打卡图片（gitignore）
└── package.json          # pnpm workspace 根配置
```

## 快速开始（本地开发）

### 环境要求

- Node.js >= 18
- pnpm（`npm i -g pnpm`）

### 安装并启动

```bash
# 1. 安装所有依赖（前端 + 后端）
pnpm install

# 2. 启动后端（端口 3001）
pnpm --filter checkin-server dev

# 3. 另开终端，启动前端（端口 5173，自动代理 API 到后端）
pnpm dev:h5
```

浏览器打开 `http://localhost:5173` 即可使用。

## 部署到服务器

### 1. 构建

```bash
# 构建前端到 dist/build/h5/
pnpm build:h5
```

### 2. 上传到服务器

把整个项目文件夹上传到服务器（或用 git clone）：

```bash
git clone <你的仓库地址> checkin-app
cd checkin-app
pnpm install
pnpm build:h5
```

### 3. 启动生产服务

```bash
# 后端会同时提供 API 和前端静态文件（单端口 3001）
cd server && pnpm start
```

生产模式下，访问 `http://你的服务器IP:3001` 即可，**无需额外配置 Nginx**（Express 直接托管前端文件）。

### 4. 保持后台运行（推荐用 pm2）

```bash
npm i -g pm2
cd server
pm2 start pnpm --name checkin-app -- start
pm2 save
pm2 startup
```

### 可选：Nginx 反向代理（HTTPS + 自定义域名）

```nginx
server {
    listen 443 ssl;
    server_name checkin.your-domain.com;

    ssl_certificate     /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 20M;  # 图片上传
    }
}
```

### iPad 添加到主屏幕（PWA 效果）

1. 用 Safari 打开网址
2. 点分享按钮 → **添加到主屏幕**
3. 桌面出现应用图标，点开全屏无浏览器栏

## API 概览

所有接口统一响应格式：`{ code: 0, data: ..., message: "ok" }`

| 方法   | 路径                 | 说明             | 认证  |
| ------ | -------------------- | ---------------- | :---: |
| POST   | `/api/auth/register` | 注册             |   ✗   |
| POST   | `/api/auth/login`    | 登录             |   ✗   |
| GET    | `/api/tasks`         | 任务列表         |   ✓   |
| GET    | `/api/tasks/today`   | 今日待办         |   ✓   |
| POST   | `/api/tasks`         | 创建任务         |   ✓   |
| PUT    | `/api/tasks/:id`     | 更新任务         |   ✓   |
| DELETE | `/api/tasks/:id`     | 删除任务         |   ✓   |
| GET    | `/api/checkins`      | 打卡记录         |   ✓   |
| POST   | `/api/checkins`      | 打卡（支持图片） |   ✓   |
| DELETE | `/api/checkins/:id`  | 删除打卡         |   ✓   |
| GET    | `/api/rewards`       | 奖励列表         |   ✓   |
| POST   | `/api/rewards`       | 创建奖励         |   ✓   |
| DELETE | `/api/rewards/:id`   | 删除奖励         |   ✓   |
| GET    | `/api/points`        | 积分查询         |   ✓   |
| POST   | `/api/redeem`        | 兑换奖励         |   ✓   |
