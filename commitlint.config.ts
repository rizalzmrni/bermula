// Batasi tipe ke daftar di docs/git.md (config-conventional juga mengizinkan style/revert).
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "header-max-length": [2, "always", 72],
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "refactor",
        "perf",
        "test",
        "docs",
        "chore",
        "build",
        "ci",
      ],
    ],
  },
};

export default config;
