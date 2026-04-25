export default {
  preset: "ts-jest",
  testEnvironment: "node",
  testTimeout: 600000, // 10 minutes
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  moduleFileExtensions: ["ts", "js", "json"],
  testMatch: ["**/__tests__/**/*.test.ts"],
};
