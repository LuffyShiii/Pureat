# Pureat

高尿酸人群的 AI 饮食决策助手。

**生产环境**: https://pureat.vercel.app

拍一张食物照片，AI 识别食物、估算份量，系统查询标准化食物数据库计算嘌呤摄入范围，并结合今日已记录摄入给出「能不能吃、建议吃多少」的三级建议。

## 技术栈

- **Frontend**: Next.js 16 + React 19 + TypeScript + Tailwind CSS v4
- **Backend**: Next.js API Routes
- **Database**: Supabase PostgreSQL（开发使用 Prisma Postgres 本地数据库）
- **ORM**: Prisma 7
- **AI**: OpenAI GPT-4o-mini Vision
- **Local Storage**: IndexedDB（饮食记录、缩略图）+ localStorage（device_id、onboarding）
- **PWA**: next-pwa

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，并填写：

- `DATABASE_URL`: Supabase 连接串（本地开发会自动使用 Prisma Postgres）
- `OPENAI_API_KEY`: OpenAI API Key

### 3. 启动本地数据库

```bash
npx prisma dev
```

### 4. 同步数据库并导入种子数据

```bash
npx prisma migrate dev
npm run db:seed
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 核心页面

- `/onboarding` - 产品介绍与免责声明
- `/` - 首页，拍照/相册/手动搜索 + 今日累计
- `/analyzing` - 识别中
- `/analysis` - 食物分析结果（支持调整份量、修改食物、加入今日饮食）
- `/history` - 历史记录，支持编辑/删除

## API 路由

- `POST /api/recognize` - 图片识别
- `POST /api/food/normalize` - 食物名称标准化
- `GET /api/food/search` - 食物搜索
- `GET /api/food/[id]` - 食物详情
- `POST /api/calculate` - 嘌呤计算与建议

## 开发脚本

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run db:seed      # 导入种子数据
npm run db:generate  # 生成 Prisma Client
npm run db:migrate   # 运行数据库迁移
npm run db:studio    # 打开 Prisma Studio
```

## 数据说明

种子数据中的嘌呤值为 MVP 占位数据，基于公开资料综合整理，标注了数据可信度。正式上线前需要由医学/营养专业人员校验。

## 部署到生产

### 1. 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com) 创建新项目
2. 在 Project Settings > Database 中获取 `DATABASE_URL`
3. 格式：`postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`

### 2. 部署到 Vercel

1. 将代码推送到 GitHub
2. 在 [vercel.com](https://vercel.com) 导入项目
3. 设置环境变量：
   - `DATABASE_URL`: Supabase 连接串
   - `OPENAI_API_KEY`: OpenAI API Key
   - `NEXT_PUBLIC_APP_URL`: 生产域名
4. 首次部署后，在 Vercel 的 Console 中运行：
   - `npx prisma migrate deploy`
   - `npm run db:seed`

### 3. 启用 pg_trgm 扩展

在 Supabase SQL Editor 中执行：

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

## License

详见 [OPEN_SOURCE.md](./OPEN_SOURCE.md)
