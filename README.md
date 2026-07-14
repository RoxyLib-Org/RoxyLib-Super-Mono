<div align="center">
  <h1>RoxyLib Super Mono</h1>
  <p>Roxy's Orgel — 基于 Cloudflare Workers 全栈应用</p>
</div>

## 技术栈

| 层级 | 技术 |
|------|------|
| 运行时 | Cloudflare Workers |
| 后端框架 | Hono |
| API 层 | tRPC |
| 前端 | React 19 + TanStack Router + TailwindCSS 4 + daisyUI 5 |
| 状态管理 | Jotai |
| 数据库 | Cloudflare D1 (SQLite) + Drizzle ORM |
| 缓存 | Cloudflare KV |
| 构建 | Vite 8 + Nx |
| CLI 工具 | ty-jk (Rust PTY wrapper, 终端劫持 + 日志轮转) |
| 代码规范 | Biome |
| 测试 | Vitest |
| 包管理 | pnpm workspaces |

## 项目结构

```
RoxyLib-Super-Mono/
├── apps/
│   ├── roxys-orgel/          # 主应用 (Hono + tRPC + TanStack Router SSR)
│   │   ├── src/
│   │   │   ├── main.tsx      # Worker 入口
│   │   │   ├── server/trpc/  # tRPC router、context、procedures
│   │   │   ├── server/apis/  # SSR fileRoute
│   │   │   ├── client/       # React hooks、tRPC client
│   │   │   ├── apps/         # TanStack Router 页面、样式
│   │   │   └── shared/       # 类型定义
│   │   ├── vite.config.ts
│   │   └── wrangler.toml
│   └── roxys-gateway/        # 转发代理 Worker (请求透传到本地)
│       ├── src/main.ts
│       └── wrangler.toml
├── libs/
│   ├── db/                   # Drizzle schema + D1 工厂
│   └── utils/                # 共享工具
├── packages/
│   └── ty-jk/                # Rust CLI (PTY 劫持 + 日志轮转)
├── plugins/                  # TypeScript fallback (x.ts, log.ts)
├── drizzle/                  # D1 数据库迁移文件
├── nx.json
├── biome.json
├── tsconfig.base.json
└── drizzle.config.ts
```

## 快速开始

### 前置条件

- Node.js 22+
- pnpm 11+
- Rust toolchain (用于构建 ty-jk)

### 安装

```bash
pnpm install
RUSTC_WRAPPER='' cargo build --release -p ty-jk
```

### 本地开发

```bash
pnpm x roxys-orgel:dev
pnpm x roxys-gateway:dev
```

通过 Nx 单独启动某个项目的 dev server，ty-jk 通过 PTY 劫持终端输出并写入 `.agents/` 日志。

### 构建

```bash
pnpm build
```

### Lint

```bash
pnpm lint
```

### 部署

```bash
# 部署主应用
pnpm deploy:orgel

# 部署网关
pnpm deploy:gateway
```

### 数据库迁移

```bash
# 生成迁移
pnpm drizzle generate

# 应用到远程 D1
cd apps/roxys-orgel && npx wrangler d1 migrations apply roxys-orgel --remote
```

## 命令体系

所有命令通过 `ty-jk` 包裹执行，提供 PTY 终端劫持和自动日志轮转。

| 命令 | 作用 |
|------|------|
| `pnpm x roxys-orgel:dev` | 启动 orgel dev server |
| `pnpm x roxys-gateway:dev` | 启动 gateway dev server |
| `pnpm x <project>:<target>` | 通过 Nx 运行任意 target |
| `pnpm build` | nx 构建全部项目 |
| `pnpm lint` | Biome 全量检查 |
| `pnpm drizzle` | Drizzle Kit CLI |
| `pnpm deploy:orgel` | 构建 + 部署 orgel Worker |
| `pnpm deploy:gateway` | 构建 + 部署 gateway Worker |

`pnpm x` 即 `./x.sh` — 有编译好的 ty-jk 二进制就用 Rust 版 (带 PTY)，否则 fallback 到 pnpm scripts。

## 环境变量

复制 `.env.example` 到 `.env` 填入实际值。Workers secrets 通过 `wrangler secret put` 设置。

| 变量 | 说明 |
|------|------|
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID |
| `CLOUDFLARE_DATABASE_ID` | D1 数据库 ID |
| `CLOUDFLARE_D1_TOKEN` | D1 HTTP API Token (drizzle-kit 远程访问) |

## 配置文件

| 文件 | 用途 |
|------|------|
| `apps/roxys-orgel/wrangler.toml` | 主 Worker 配置 (D1, KV) |
| `apps/roxys-gateway/wrangler.toml` | 网关 Worker 配置 |
| `drizzle.config.ts` | Drizzle ORM 配置 |
| `tsconfig.base.json` | 全局 TypeScript 配置 (路径别名 `@lib/*`, `@/*`) |
| `biome.json` | 代码风格 + Lint 规则 |
| `nx.json` | Nx workspace + Vite plugin |
