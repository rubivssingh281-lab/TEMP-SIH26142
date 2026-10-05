/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // When NEXT_PUBLIC_API_BASE_URL points at a running FastAPI backend, the typed
  // API client in src/lib/api.ts calls it directly. Left unset, the app serves
  // itself from the built-in Next.js mock API routes under /app/api/*.
};

export default nextConfig;
