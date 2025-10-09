import { defineConfig, Options } from "tsup";

export default defineConfig((options: Options) => ({
  entry: {
    index: "src/index.tsx",
  },
  // Emit pure ESM to avoid dynamic require shims in Next.js
  format: ["esm"],
  platform: "browser",
  target: ["es2020"],
  clean: true,
  skipNodeModulesBundle: true,
  // Ensure ESM extension for clarity
  outExtension({ format }) {
    return {
      js: format === "esm" ? ".mjs" : ".js",
    };
  },
  treeshake: false,
  esbuildOptions(options) {
    options.banner = {
      js: '"use client"',
    };
    // Prefer ESM/browser entrypoints from dependencies
    options.mainFields = ["module", "browser", "main"];
    // Ensure resolver picks ESM conditions in packages that export conditionally
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - esbuild Options may accept conditions via tsup passthrough
    (options as any).conditions = ["module", "import", "browser"];
  },
  dts: true,
  minify: true,
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "next-themes",
    "sonner",
    "clsx",
    "tailwind-merge",
    "class-variance-authority",
    "lucide-react",
    "@radix-ui/react-avatar",
    "@radix-ui/react-collapsible",
    "@radix-ui/react-dialog",
    "@radix-ui/react-dropdown-menu",
    "@radix-ui/react-hover-card",
    "@radix-ui/react-label",
    "@radix-ui/react-separator",
    "@radix-ui/react-slot",
    "@radix-ui/react-tooltip",
    "recharts",
  ],
  ...options,
}));
