declare module "next-pwa" {
  import type { NextConfig } from "next";

  function nextPWA(options?: {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    scope?: string;
    sw?: string;
    runtimeCaching?: unknown[];
    [key: string]: unknown;
  }): (config: NextConfig) => NextConfig;

  export default nextPWA;
}
