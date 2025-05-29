// @ts-check

import eslint from "@eslint/js";
// import vitest from "@vitest/eslint-plugin";
import perfectionist from "eslint-plugin-perfectionist";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: ["**/*.js"],
    },
    eslint.configs.recommended,
    tseslint.configs.strictTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            "@typescript-eslint/restrict-template-expressions": "off",
        },
    },
    // perfectionist.configs["recommended-natural"],
    // {
    //     files: ["**/*.test.ts", "**/*.spec.ts"],
    //     plugins: {
    //         vitest,
    //     },
    //     rules: {
    //         ...vitest.configs.recommended.rules,
    //         "@typescript-eslint/unbound-method": "off",
    //     },
    // },
    perfectionist.configs["recommended-natural"],
    {
        files: ["**/*.ts"],
        rules: {
            "perfectionist/sort-class-members": "off",
            "perfectionist/sort-classes": "off",
            "perfectionist/sort-interfaces": "off",
            "perfectionist/sort-objects": "off",
        },
    },
);
