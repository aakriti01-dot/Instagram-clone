import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.67"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gtagpzvmltlqhmwmxrld.supabase.co",
        pathname: "/storage/v1/object/public/post-images/**",
      },
    ],
  },
};

export default nextConfig;
