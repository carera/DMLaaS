module.exports = {
  automock: false,
  cacheDirectory: "<rootDir>/.jest",
  moduleFileExtensions: ["ts", "js", "json"],
  // setupFilesAfterEnv: ["<rootDir>/jest-setup.ts"],
  silent: false,
  testEnvironment: "node",
  testMatch: ["**/?(*.)+(unit|e2e|spec).ts"],
  testPathIgnorePatterns: [
    "test-e2e/test-helpers/e2e.ts",
    ".*.fixture.ts",
    ".*.mock.ts"
  ],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/test-helpers/**",
    "!src/dev/**",
    "!src/**/*.unit.ts",
    "!src/**/*.fixture.ts",
    "!src/**/*.mock.ts"
  ],
  transform: { "^.+\\.ts$": "ts-jest" },
  verbose: true
};
