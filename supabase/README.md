# Supabase 集成指南

## 已完成的集成

### 1. 安装依赖
- `@supabase/supabase-js` - Supabase JavaScript 客户端
- `@supabase/ssr` - 服务端渲染支持

### 2. 配置文件
- `src/lib/supabase/server.ts` - 服务端客户端（Server Components、API Routes）
- `src/lib/supabase/client.ts` - 客户端客户端（Client Components）
- `src/lib/supabase/middleware.ts` - Middleware 辅助函数
- `middleware.ts` - Next.js Middleware（session 刷新）

### 3. 数据库迁移
- `supabase/migrations/001_initial_schema.sql` - 数据库 schema

### 4. 认证页面
- `/login` - 登录/注册页面
- `/auth/callback` - OAuth 回调
- `/logout` - 登出

## 下一步配置

### 1. 运行数据库迁移

1. 登录 [Supabase 控制台](https://supabase.com/dashboard)
2. 进入你的项目
3. 点击左侧菜单 **SQL Editor**
4. 复制 `supabase/migrations/001_initial_schema.sql` 的内容
5. 粘贴并执行

### 2. 配置认证

1. 在 Supabase 控制台，进入 **Authentication → Providers**
2. 确保 **Email** 已启用（默认已启用）
3. （可选）配置其他登录方式：Google、GitHub 等

### 3. 配置 Storage（文件存储）

1. 在 Supabase 控制台，进入 **Storage**
2. 创建一个新的 Bucket，命名为 `uploads`
3. 设置访问策略（Public 或 Private）

### 4. 更新环境变量

确保 `.env.local` 包含以下变量：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 测试应用

```bash
npm run dev
```

访问 http://localhost:3000/login 测试登录功能。

## 数据库 Schema

### tables

| 表名 | 说明 |
|------|------|
| `templates` | 复盘模板 |
| `template_sections` | 模板章节 |
| `reviews` | 复盘记录 |
| `review_sections` | 复盘章节 |
| `action_items` | 行动项 |

### Row Level Security (RLS)

已配置 RLS 策略：
- 模板：所有人可读，认证用户可写
- 复盘记录：用户只能访问自己的数据
- 章节和行动项：跟随复盘记录的权限

## 常见问题

### Q: 如何迁移现有数据？

A: 如果你有现有的 SQLite 数据需要迁移，可以：
1. 导出 SQLite 数据为 JSON
2. 使用 Supabase 的导入功能或编写迁移脚本

### Q: 如何添加新的登录方式？

A: 在 Supabase 控制台的 **Authentication → Providers** 中启用即可。

### Q: 如何使用 Storage？

A: 在 Client Components 中：

```typescript
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

// 上传文件
const { data, error } = await supabase.storage
  .from("uploads")
  .upload("path/to/file", file);

// 获取公共 URL
const { data: { publicUrl } } = supabase.storage
  .from("uploads")
  .getPublicUrl("path/to/file");
```
