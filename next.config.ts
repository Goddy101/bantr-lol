import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow external images from API-Sports CDN
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.api-sports.io",
        pathname: "/**", // Allows all image paths from this domain
      },
      {
        protocol: "https",
        hostname: "media-*.api-sports.io", // API-Sports sometimes uses media-1, media-2, etc.
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.api-sports.io", // Catch-all fallback
        pathname: "/**",
      }
    ],
  },
};

export default nextConfig;





// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;
