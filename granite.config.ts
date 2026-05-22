import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "pawesome-squad",
  brand: {
    displayName: "동물 서포터즈",
    primaryColor: "#9575CD",
    icon: "https://static.toss.im/appsintoss/25061/7a4ebc75-089b-446b-8392-8ea40d536a1c.png",
  },
  web: {
    host: "192.168.0.225",
    port: 5173,
    commands: {
      dev: "vite dev --host 0.0.0.0",
      build: "vite build",
    },
  },
  permissions: [],
  outdir: "dist",
});
