/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "firebasestorage.googleapis.com",
      "arweave.net",
      "image-cache-service-z3w7d7dnea-ew.a.run.app",
    ],
  },
};

module.exports = nextConfig;
