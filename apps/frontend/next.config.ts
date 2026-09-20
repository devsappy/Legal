import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const BACKEND_URL = (process.env.BACKEND_URL ?? "http://127.0.0.1:4000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The shared package ships TypeScript source, so Next compiles it with the app.
  transpilePackages: ["@sahayak/shared"],
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  // Browser calls to /api/* go to the backend on the same origin, so cookies just work.
  // The frontend's own routes (e.g. /api/mock/chat) still win: rewrites run after the filesystem.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
};

export default withNextIntl(nextConfig);
