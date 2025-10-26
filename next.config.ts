import type { NextConfig } from "next";

const ONE_YEAR = 31536000;

const nextConfig: NextConfig = {
  reactStrictMode: true,

  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },

  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: `public, max-age=${ONE_YEAR}, immutable`,
          },
        ],
      },
      {
        source: "/:path*\\.(webp|jpg|jpeg|png|gif|svg)$",
        headers: [
          {
            key: "Cache-Control",
            value: `public, max-age=${ONE_YEAR}, immutable`,
          },
        ],
      },
      {
        source: "/:path*\\.(woff|woff2|ttf|eot)$",
        headers: [
          {
            key: "Cache-Control",
            value: `public, max-age=${ONE_YEAR}, immutable`,
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      {
        source: "/",
        destination: "/fr",
        permanent: false, // temporary; flip to true when ready
        basePath: false,
      },
    ];
  },

  webpack(config) {
    // optional: ensure webpack build handles svg import fallback
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
      type: "javascript/auto",
    });

    return config;
  },
};

export default nextConfig;
