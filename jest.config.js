import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

// sanitize-html's parser (htmlparser2 and its dom* helpers) ships as ESM only,
// so those packages are transformed instead of skipped like the rest of
// node_modules. next/jest's own ignore list is replaced, not extended,
// because its plain "/node_modules/" entry would still skip them.
const ESM_PACKAGES = [
  "htmlparser2",
  "domhandler",
  "domutils",
  "dom-serializer",
  "domelementtype",
  "entities",
];

export default async function jestConfig() {
  const resolved = await createJestConfig(config)();
  return {
    ...resolved,
    transformIgnorePatterns: [
      `/node_modules/(?!(${ESM_PACKAGES.join("|")})/)`,
      "^.+\\.module\\.(css|sass|scss)$",
    ],
  };
}
