import * as fs from "promise-fs";
import { interpret } from "../src/interpreter";

const expectedValues: { [key: string]: any } = {
  "examples/basics.dml": 13,
  "examples/condition.dml": -2,
  "examples/fibonacci.dml": 21,
  "examples/function.dml": 58,
  "examples/lists.dml": ["1", "3", "5", "7", "1", "2"],
  "examples/nestedFunctions.dml": 8,
  "examples/parallel.dml": [5, 6, 4096]
};

describe("Example programs", () => {
  // Load each file, run it and compare to expected value
  for (const file in expectedValues) {
    it(`Should run ${file}`, async () => {
      const program = await fs.readFile(file, "utf-8");
      const code = program.split("\n");
      const result = await interpret(code, [], true);
      expect(result).toEqual(expectedValues[file]);
    });
  }
});
