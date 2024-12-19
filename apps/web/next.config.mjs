/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/tags", "@repo/ui", "@repo/hooks"],
}

export default nextConfig
