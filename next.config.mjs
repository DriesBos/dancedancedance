/** @type {import('next').NextConfig} */
const nextConfig = {
  sassOptions: {
    additionalData: `@import "src/assets/styles/variables.sass"`,
  },
};

export default nextConfig;
