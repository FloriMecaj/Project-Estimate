import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static: `next build` writes plain HTML/JS to ./out. No server code.
  output: "export",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
