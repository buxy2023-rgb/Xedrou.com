/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The app underneath app/[[...slug]] is a client-rendered React-Router SPA
  // (unchanged from the original Vite app), so nothing here needs server
  // components or SSR data fetching support beyond the shell.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://xedruo-backend.onrender.com/api/:path*",
      },
    ];
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

module.exports = nextConfig;
