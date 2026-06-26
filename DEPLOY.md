# 部署指南

## 部署到 Vercel

### 步骤 1：准备 GitHub 仓库

1. 确保代码已推送到 GitHub：
   ```bash
   git add .
   git commit -m "feat: 初始化项目"
   git push origin main
   ```

### 步骤 2：在 Vercel 上创建项目

1. 访问 [vercel.com](https://vercel.com) 并登录
2. 点击 "New Project"
3. 导入你的 GitHub 仓库
4. 配置项目：
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`（默认）
   - **Build Command**: `npx prisma generate && next build`（已在 vercel.json 中配置）
5. 添加环境变量：
   - `DATABASE_URL`: `file:./prisma/dev.db`
   - `ANTHROPIC_API_KEY`: 你的 Anthropic API Key（可选）
6. 点击 "Deploy"

### 步骤 3：配置 GitHub Actions 自动部署

1. 在 Vercel 项目设置中获取以下信息：
   - **VERCEL_TOKEN**: 在 Vercel Account Settings > Tokens 中创建
   - **VERCEL_ORG_ID**: 在 Vercel 项目设置中找到
   - **VERCEL_PROJECT_ID**: 在 Vercel 项目设置中找到

2. 在 GitHub 仓库设置中添加 Secrets：
   - 进入 Settings > Secrets and variables > Actions
   - 添加以下 secrets：
     - `VERCEL_TOKEN`
     - `VERCEL_ORG_ID`
     - `VERCEL_PROJECT_ID`

3. 现在每次推送到 `main` 分支都会自动部署

## 重要说明

### SQLite 限制

本项目使用 SQLite 作为数据库，部署到 Vercel 后有以下限制：

1. **只读数据库**: Vercel 的 Serverless Functions 不支持持久化文件写入
2. **数据重置**: 每次部署后，数据库可能会被重置为初始状态
3. **建议方案**:
   - 开发/演示用途：可以使用 SQLite
   - 生产环境：建议迁移到 PostgreSQL（Vercel Postgres、Supabase、Neon 等）

### 如需迁移到 PostgreSQL

1. 修改 `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. 更新环境变量：
   ```
   DATABASE_URL="postgresql://user:password@host:5432/dbname"
   ```

3. 运行迁移：
   ```bash
   npx prisma migrate deploy
   ```

## 其他部署选项

### 使用 Docker

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

### 使用 PM2（自托管服务器）

```bash
# 安装 PM2
npm install -g pm2

# 构建项目
npm run build

# 启动服务
pm2 start npm --name "fupan" -- start

# 保存进程列表
pm2 save

# 设置开机自启
pm2 startup
```
