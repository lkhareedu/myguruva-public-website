import type { NextConfig } from "next";
import path from "path";

const PUBLIC_API_BASE_URL = (process.env.PUBLIC_API_BASE_URL ?? "http://localhost:4100").replace(
  /\/$/,
  "",
);

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  async rewrites() {
    // Browser + relative fetches hit /v1/* → middleware (not Next Route Handlers).
    return [
      {
        source: "/v1/:path*",
        destination: `${PUBLIC_API_BASE_URL}/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
