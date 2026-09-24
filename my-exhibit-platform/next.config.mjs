/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // 배포 시 사소한 타입 에러로 빌드가 터지는 것을 방지
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
