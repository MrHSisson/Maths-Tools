// Lint is deliberately narrow: it turns on the React hooks rules (a missing dependency in an effect is a stale-value bug that the type
// checker cannot see) and nothing else. Every file under src is checked. A deliberate exception is written `// eslint-disable-line react-hooks/exhaustive-deps -- deliberate: <why>`.
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  { ignores: ["dist/**", "node_modules/**", "src/generated/**", "api/**", "scripts/**"] },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { "react-hooks": reactHooks, "@typescript-eslint": tseslint.plugin },
    linterOptions: { reportUnusedDisableDirectives: "off" },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
    },
  },
];
