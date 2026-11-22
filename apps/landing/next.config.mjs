/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static HTML export: the landing page needs no server.
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
