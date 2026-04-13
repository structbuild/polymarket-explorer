import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  async redirects() {
    return [
      {
        source: "/leaderboard",
        destination: "/traders",
        permanent: true,
      },
      {
        source: "/tags/page/1",
        destination: "/tags",
        permanent: true,
      },
      {
        source: "/market/:slug",
        destination: "/markets/:slug",
        permanent: true,
      },
      {
        source: "/trader/:address",
        destination: "/traders/:address",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;

