// Worker bindings — run `wrangler types` to regenerate
interface CloudflareBindings {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
}
