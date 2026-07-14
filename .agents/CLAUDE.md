# Claude

## 核心约束

- **严格 TypeScript**: 禁止 `any`、`as any`、`@ts-ignore`。使用 `unknown` + 类型守卫
- **Biome**: 提交前必须 `pnpm lint` 通过
- **测试隔离**: 测试放 `tests/`，不允许 `src/` 内出现测试文件
- **路由安全**: `src/apps/routers/` 只放路由模块，其他文件会被文件路由扫描器误识别

## 项目结构

```
apps/roxys-orgel/     → 主应用 (Hono + tRPC + TanStack Router SSR)
apps/roxys-gateway/   → 转发代理 Worker
libs/db/              → Drizzle schema + D1 工厂
libs/utils/           → 共享工具
packages/ty-jk/       → Rust CLI (PTY wrapper)
plugins/              → TS fallback (x.ts, log.ts)
```

## 常用命令

```bash
pnpm x roxys-orgel:dev      # 启动 orgel 开发
pnpm x roxys-gateway:dev    # 启动 gateway 开发
pnpm build                  # 构建全部
pnpm lint                   # lint 全部
pnpm drizzle generate       # 生成迁移
```

## 编码规范

- import 使用 `@/` (当前 app src) 和 `@lib/` (libs) 别名
- 组件文件 PascalCase，工具文件 camelCase
- 数据库 schema 定义在 `libs/db/src/schema.ts`
- tRPC router 在 `src/server/trpc/router.ts`
- 新增 procedure 在 `src/server/trpc/` 下按功能拆分文件

## Workers 注意事项

- 不能使用 Node.js 全局 API (fs, path 等)，Workers 环境仅 Web APIs
- Bindings 通过 Hono Context 的 `c.env` 获取
- D1 查询用 Drizzle ORM，不写裸 SQL
- KV/R2 等绑定类型在 `worker-configuration.d.ts` 自动生成
