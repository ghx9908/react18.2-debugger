import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"
export default defineConfig({
  define: {
    __DEV__: true,
    __PROFILE__: true,
    __UMD__: true,
    __EXPERIMENTAL__: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      react: path.resolve(__dirname, "src/react/packages/react"),
      "react-dom": path.resolve(__dirname, "src/react/packages/react-dom"),
      "react-dom-bindings": path.posix.resolve(
        "src/react/packages/react-dom-bindings"
      ),
      "react-reconciler": path.resolve(
        __dirname,
        "src/react/packages/react-reconciler"
      ),
      scheduler: path.resolve(__dirname, "src/react/packages/scheduler"),
      shared: path.resolve(__dirname, "src/react/packages/shared"),
    },
  },
  plugins: [react()],
  optimizeDeps: {
    force: true,
  },
})
