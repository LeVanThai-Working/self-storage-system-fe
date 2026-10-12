import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./lib/i18n/config.ts");

const backendUrl = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://self-storage-system-be.onrender.com"
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
