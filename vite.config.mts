import { defineConfig } from "vite";

type LibTypes = "transforms" | "cli";

const LIB: LibTypes = (process.env.LIB as LibTypes) ?? "transforms";

const libConfig: Record<LibTypes, { entry: string; fileName: string }> = {
    transforms: {
        entry: "src/transforms/index.ts",
        fileName: "transforms/index",
    },
    cli: {
        entry: "src/cli.ts",
        fileName: "index",
    },
};

const currentConfig = libConfig[LIB];

export default defineConfig(() => ({
    build: {
        emptyOutDir: false,
        lib: {
            fileName: currentConfig.fileName,
            entry: currentConfig.entry,
            formats: ["cjs" as const],
        },
        rollupOptions: {
            external: [
                /* transformsで使用するが、直接依存は不要 */
                "jscodeshift",

                "events",
                "node:fs/promises",
            ],
        },
    },
}));
