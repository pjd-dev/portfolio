import type { NextConfig } from "next";

const ONE_YEAR = 31536000;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            svgo: true,
          },
        },
      ],
    });
    return config;
  },
  async headers() {
    return [
      {
        // Next.js static chunks
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: `public, max-age=${ONE_YEAR}, immutable`,
          },
        ],
      },
      {
        // All images in /public (extension-matched)
        source: "/:path*\\.(webp|jpg|jpeg|png|gif|svg)$",
        headers: [
          {
            key: "Cache-Control",
            value: `public, max-age=${ONE_YEAR}, immutable`,
          },
        ],
      },
      {
        // Fonts in /public
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
  // in next.config.ts
  async redirects() {
    return [
      {
        source: "/",
        destination: "/fr",
        permanent: true, // keep 302; switch to true only when stable
        basePath: false,
      },
    ];
  },
};

export default nextConfig;
