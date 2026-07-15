// Worker bindings — run `wrangler types` to regenerate
interface GatewayBindings {
  UPSTREAM_URL: string;
  VPC_PAN: Fetcher;
  VPC_BOOK: Fetcher;
}
