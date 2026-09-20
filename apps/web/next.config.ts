import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Native / CLI-style packages stay in node_modules at runtime (also needed for the Docker standalone build)
  serverExternalPackages: ["better-sqlite3", "pdf-parse"],
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
};

export default withNextIntl(nextConfig);
