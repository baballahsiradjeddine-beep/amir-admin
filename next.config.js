/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    images: {
        unoptimized: true,
    },
    // Disable server-side features for Electron
    trailingSlash: true,
};

module.exports = nextConfig;
