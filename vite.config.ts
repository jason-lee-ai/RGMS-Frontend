import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const devHost = env.DEV_HOST?.trim();
  /** `127.0.0.1` / `localhost` = loopback only (works with Astrill VPN on). Omit or `all` = every interface (LAN IP). */
  const host =
    devHost === "127.0.0.1" || devHost === "localhost"
      ? devHost
      : true;

  return {
    plugins: [react()],
    base: "/",
    server: {
      host,
      port: 5173,
      strictPort: true,
      allowedHosts: true,
      proxy: {
        "/api": {
          target: "http://127.0.0.1:3001",
          changeOrigin: true,
        },
      },
    },
    preview: {
      host,
      port: 5173,
      strictPort: true,
      allowedHosts: true,
    },
  };
});
