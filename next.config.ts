import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  serverExternalPackages: ["sharp"],
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
      {
        protocol: "https",
        hostname: "struct-images.fra1.digitaloceanspaces.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;

