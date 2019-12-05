import { log } from "./logger";
import axios from "axios";

type HiResTime = [number, number];
const NS_PER_MILLI_SEC = 1e6;
const MILLI_SEC_PER_SEC = 1e3;
const INDENTATION = "  ";

export const interpret = async (
  input: string[],
  outputOnlny: boolean = false
) => {
  const code = input.filter(row => row.trim().length);
  let i = 0;
  let finalResponse = null;
  while (code[i]) {
    let line = code[i];

    // nesting
    let payload: string[] = [];
    while (code[i + 1] && code[i + 1].match(/^\s+/)) {
      const trimmed = code[i + 1].replace(/^\s\s/, "");
      payload.push(trimmed);
      i++;
    }

    // conditions

    const instruction = line;
    const url = `http://localhost:3000/${instruction}`;
    !outputOnlny && log(`Hitting ${url}`);
    const startTime = process.hrtime();
    const result = await axios.post(url, payload);
    const diff: HiResTime = process.hrtime(startTime);
    const totalTime = diff[0] * MILLI_SEC_PER_SEC + diff[1] / NS_PER_MILLI_SEC;
    !outputOnlny &&
      log(`Response (${totalTime}ms): ${JSON.stringify(result.data)}`);
    finalResponse = result.data;
    i++;
  }
  return finalResponse;
};
