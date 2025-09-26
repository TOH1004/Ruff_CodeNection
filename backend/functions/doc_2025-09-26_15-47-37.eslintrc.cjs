// functions/.eslintrc.cjs
module.exports = {
  env: { es2020: true, node: true },
  parserOptions: { ecmaVersion: 2020, sourceType: "script" },
  extends: ["eslint:recommended", "google"],
  rules: {
    "linebreak-style": "off",            // Windows CRLF ok
    "require-jsdoc": "off",
    "arrow-parens": "off",
    "indent": "off",
    "no-multi-spaces": "off",
    "object-curly-spacing": "off",
    "max-len": ["warn", { code: 120 }],
    "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "no-console": "off",
    "quotes": ["error", "double", { allowTemplateLiterals: true }],
    "prefer-arrow-callback": "off",
  },
};
