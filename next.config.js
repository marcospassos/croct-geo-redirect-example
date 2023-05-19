/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    CROCT_API_KEY: process.env.CROCT_API_KEY,
  }
}

module.exports = nextConfig
