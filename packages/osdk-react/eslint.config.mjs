import javascript from "@eslint/js";
import typescript from "typescript-eslint";
import react from "eslint-plugin-react";

export default [
    {
        ignores: ["**/*", "!src", "!src/**/*"],
    },
    javascript.configs.recommended,
    ...typescript.configs.recommendedTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    react.configs.flat.recommended,
    react.configs.flat["jsx-runtime"],
    {
        rules: {
            "react/prop-types": "off",
        },
    },
];
