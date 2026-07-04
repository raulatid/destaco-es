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
  // IndexNow exige (en la práctica) el fichero de clave clásico en la raíz:
  // /{clave}.txt. Lo servimos reescribiendo a la ruta que ya publica la clave.
  async rewrites() {
    const key = process.env.INDEXNOW_KEY;
    return key
      ? [{ source: `/${key}.txt`, destination: "/api/indexnow-key" }]
      : [];
  },
};

export default nextConfig;
