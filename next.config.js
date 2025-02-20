/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["cdn.nba.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.nba.com",
        pathname: "/headshots/nba/**",
      },
    ],
  },
};

module.exports = nextConfig;
