/** @type {import('vite').UserConfig} */
export default {
    build: {
        lib: {
            entry: "src/transforms/index.ts",
            fileName: "index",
            formats: ["cjs"],
        },
        rollupOptions: {
            external: ["jscodeshift"],
        },
    },
};
