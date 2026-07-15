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
│   └── roxys-gateway/        # 转发代理 Worker
├── libs/
│   ├── db/                   # Drizzle schema + D1 工厂
│   └── utils/                # 共享工具
├── packages/
│   └── ty-jk/                # Rust CLI (PTY 劫持 + 日志轮转)
├── plugins/                  # TypeScript fallback (x.ts, log.ts)
└── drizzle/                  # D1 数据库迁移文件
```

## 快速开始

```bash
pnpm install
RUSTC_WRAPPER='' cargo build --release -p ty-jk
```

## 开发

```bash
pnpm x roxys-orgel:dev
pnpm x roxys-gateway:dev
```

## 构建

```bash
pnpm x roxys-orgel:build
pnpm x roxys-gateway:build
```

## 部署

```bash
# 生产 (全量部署)
pnpm x roxys-orgel:deploy
pnpm x roxys-gateway:deploy

# 非生产分支 (仅上传新版本，不切流量)
pnpm x roxys-orgel:deploy:update
pnpm x roxys-gateway:deploy:update
```

## 数据库迁移

```bash
# 生成迁移
pnpm drizzle generate

# 应用到远程 D1
pnpm x roxys-orgel:d1-migrate
```

## 命令参考

| 命令 | 作用 |
|------|------|
| `pnpm x <project>:<target>` | 通过 ty-jk + Nx 运行 (带 PTY 日志) |
| `pnpm build` | 构建全部项目 |
| `pnpm lint` | Biome 全量检查 |
| `pnpm drizzle` | Drizzle Kit CLI |

`pnpm x` 即 `./x.sh` — 有 ty-jk 二进制走 Rust PTY，否则 fallback 到 `pnpm run`。

## 环境变量

复制 `.env.example` 到 `.env`。Workers secrets 通过 `wrangler secret put` 设置。

| 变量 | 说明 |
|------|------|
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID |
| `CLOUDFLARE_DATABASE_ID` | D1 数据库 ID |
| `CLOUDFLARE_D1_TOKEN` | D1 HTTP API Token (drizzle-kit 远程访问) |
