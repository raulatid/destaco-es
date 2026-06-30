import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
    // El formulario de empresa envía la foto de portada como data URL (ya
    // comprimida en el cliente a ~0,5 MB). Subimos el límite por defecto de 1 MB
    // de las Server Actions para dar holgura.
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
