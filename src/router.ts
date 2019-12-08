import { interpret } from "./interpreter";
import Router = require("koa-router");
import memory from "./memory";
import { InstructionData } from "./interfaces";
const router = new Router();

// Program initialization

router.post("/program/:name", async ctx => {
  const { name } = ctx.params;
  // initialize memory for program
  const scope = memory.createScope(`${name}/`);
  const result = await interpret(ctx.request.body.code, [scope]);
  memory.clearScope(scope);
  ctx.body = result;
});

// Function declaration

router.post(/^\/defn\/(.*)$/, ctx => {
  const path = ctx.params[0].split("/");
  const [name, ...args] = path;
  const scope = memory.getInnermostScope(ctx.request.body.scopes);
  memory.memory[scope].functions[name] = {
    code: ctx.request.body.code,
    params: args
  };
  ctx.body = name;
});

// Function invocation

router.post(/^\/callfn\/(.*)$/, async ctx => {
  const path = ctx.params[0].split("/");
  const [name, ...args]: string[] = path;
  const { code, params } = memory.findFunction(name, ctx.request.body.scopes);
  const scope = memory.createScope();
  const scopes = [...ctx.request.body.scopes, scope];
  const argVals = args.map(arg => memory.findVariableValue(arg, scopes));
  // Populate scope memory with passed arguments
  for (let i = 0; i < args.length; i++) {
    const param = params[i];
    const arg = argVals[i];
    memory.memory[scope].vars[param] = arg;
  }
  const result = await interpret(code, scopes);
  memory.clearScope(scope);
  ctx.body = result; // return value
});

// Variable declaration

router.post("/var/:name/:value", ctx => {
  const scope = memory.getInnermostScope(ctx.request.body.scopes);
  const name = ctx.params.name;
  memory.memory[scope].vars[name] = ctx.params.value;
  ctx.body = ctx.params.value;
});

/**
 * Variable retrieval or declaration from evaluation
 * One can use this to either assign an evaluation to a variable, e.g.:
 *
 * var/a
 *   +/3/5   // assigns a = 3 + 5
 *
 * Or to retrieve a value from variable:
 *
 * var/a/3  // assigns a = 3
 * var/a    // returns 3
 */
router.post("/var/:name", async ctx => {
  const code = ctx.request.body.code;
  const name = ctx.params.name;
  const scopes = ctx.request.body.scopes;
  if (code && code.length) {
    const scope = memory.getInnermostScope(scopes);
    // const newScope = createScope();
    const value = await interpret(ctx.request.body.code, scopes);
    memory.memory[scope].vars[name] = value;
    ctx.body = value;
  } else {
    ctx.body = memory.findVariableValue(name, scopes);
  }
});

// Arrays

router.post(/\/array\/(.*)/, ctx => {
  const items: string[] = ctx.params[0].split("/");
  ctx.body = items.map(item =>
    memory.findVariableValue(item, ctx.request.body.scopes)
  );
});

// const arrObj = Object.getOwnPropertyNames(Array.prototype);
// for (const funcKey in arrObj) {
//   console.log(arrObj[funcKey]);
// }

// While loop

// router.post("/while", async ctx => {
//   const condition = ctx.params.cond;
//   log(`looping while ${condition}`);
//   ctx.body = "loop";
// });

// If condition

const conditionMap: { [key: string]: (...args: any) => boolean } = {
  "<": (a, b) => a < b,
  ">": (a, b) => a > b,
  "<=": (a, b) => a <= b,
  ">=": (a, b) => a >= b,
  "==": (a, b) => a == b,
  "!=": (a, b) => a != b
};

router.post("/if/:cond/:left/:right", async (ctx, next) => {
  const { cond, left, right } = ctx.params;
  const evaluateCondition = conditionMap[cond];
  if (!evaluateCondition) {
    return next();
  }
  const { code, scopes }: InstructionData = ctx.request.body;
  const leftVal = memory.findVariableValue(left, scopes);
  const rightVal = memory.findVariableValue(right, scopes);
  // const elseCode = code.findIndex(item => item === 'else')
  if (evaluateCondition(leftVal, rightVal)) {
    // Execute block of code
    ctx.body = await interpret(code, scopes);
  } else {
    ctx.body = false;
  }
});

// Parallelism

router.post("/parallel/:callback*", async (ctx, next) => {
  const { code, scopes }: InstructionData = ctx.request.body;
  const promises = code.map(line => interpret([line], scopes));
  const result = await Promise.all(promises);
  const callbackName = ctx.params.callback;
  // if (callbackName) {
  //   const callback = memory.findFunction(callbackName, scopes);
  //   TODO invoke callback
  // } else {
  //   ctx.body = result;
  // }
  ctx.body = result;
});

// Basic math operations

const mathOperations: { [key: string]: (...args: any) => any } = {
  "+": (a: number, b: number) => a + b,
  "-": (a: number, b: number) => a - b,
  "*": (a: number, b: number) => a * b,
  "/": (a: number, b: number) => a / b,
  "**": (a: number, b: number) => a ** b
};

router.post("/:op/:a/:b", (ctx, next) => {
  const op = mathOperations[ctx.params.op as any];
  if (!op) {
    return next();
  }
  const a = +memory.findVariableValue(ctx.params.a, ctx.request.body.scopes);
  const b = +memory.findVariableValue(ctx.params.b, ctx.request.body.scopes);
  ctx.body = op(a, b);
});

export default router;
