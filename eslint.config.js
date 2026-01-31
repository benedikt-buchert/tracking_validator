import globals from "globals";
import js from "@eslint/js";
import jest from "eslint-plugin-jest";
import prettier from "eslint-plugin-prettier/recommended";

export default [
  js.configs.recommended,
  {
    files: ["tests/**/*.js"],
    ...jest.configs["flat/recommended"],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  prettier,
];
