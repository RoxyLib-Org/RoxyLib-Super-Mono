// Worker bindings — run `wrangler types` to regenerate
interface GatewayBindings {
  UPSTREAM_URL: string;
  VPC: Fetcher & {
    connect(address: string): Socket;
  };
}
