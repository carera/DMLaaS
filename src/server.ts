import * as Koa from "koa";
import * as Router from "koa-router";
import { log } from "./logger";
import * as uuid from "uuid";
import { interpret } from "./interpreter";
import * as bodyParser from "koa-bodyparser";
const app = new Koa();

const router = new Router();

const memory: { [key: string]: any } = {
  scopes: {}
};

const createScope = (prefix: string = "") => {
  const id = `${prefix}${uuid.v4()}`;
  memory.scopes[id] = { functions: {}, vars: {} };
  return id;
};

const getInnermostScope = (scopes: string[]) => {
  return scopes[scopes.length - 1];
};

const findFunction = (name: string, scopes: string[]) => {
  for (let i = scopes.length - 1; i >= 0; i--) {
    const scopeName = scopes[i];
    const scope = memory.scopes[scopeName];
    if (scope.functions[name]) {
      return scope.functions[name];
    }
  }
  throw new Error(`Function ${name} not found.`);
};

const findVariableValue = (name: string, scopes: string[]) => {
  for (let i = scopes.length - 1; i >= 0; i--) {
    const scopeName = scopes[i];
    const scope = memory.scopes[scopeName];
    if (scope.vars[name] !== undefined) {
      return scope.vars[name];
    }
  }
  // var not found, returning the name, maybe it's supposed to be value
  return name;
};

// Program initialization

router.post("/program/:name", async ctx => {
  const { name } = ctx.params;
  // initialize memory for program
  const scope = createScope(`${name}/`);
  const result = await interpret(ctx.request.body.code, [scope]);
  ctx.body = result;
});

// Function declaration

router.post(/^\/defn\/(.*)$/, ctx => {
  const path = ctx.params[0].split("/");
  const [name, ...args] = path;
  const scope = getInnermostScope(ctx.request.body.scopes);
  memory.scopes[scope].functions[name] = {
    code: ctx.request.body.code,
    params: args
  };
  ctx.body = name;
});

// Function invocation

router.post(/^\/callfn\/(.*)$/, async ctx => {
  const path = ctx.params[0].split("/");
  const [name, ...args]: string[] = path;
  const { code, params } = findFunction(name, ctx.request.body.scopes);
  const scope = createScope();
  const scopes = [...ctx.request.body.scopes, scope];
  const argVals = args.map(arg => findVariableValue(arg, scopes));
  // Populate scope memory with passed arguments
  for (let i = 0; i < args.length; i++) {
    const param = params[i];
    const arg = argVals[i];
    memory.scopes[scope].vars[param] = arg;
  }
  const result = await interpret(code, scopes);

  ctx.body = result; // return value
});

// Variable declaration

router.post("/var/:name/:value", ctx => {
  const scope = getInnermostScope(ctx.request.body.scopes);
  const name = ctx.params.name;
  memory.scopes[scope].vars[name] = ctx.params.value;
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
    const scope = getInnermostScope(scopes);
    // const newScope = createScope();
    const value = await interpret(ctx.request.body.code, scopes);
    memory.scopes[scope].vars[name] = value;
    ctx.body = value;
  } else {
    ctx.body = findVariableValue(name, scopes);
  }
});

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
  const {
    code,
    scopes
  }: { code: string[]; scopes: string[] } = ctx.request.body;
  const leftVal = findVariableValue(left, scopes);
  const rightVal = findVariableValue(right, scopes);
  // const elseCode = code.findIndex(item => item === 'else')
  if (evaluateCondition(leftVal, rightVal)) {
    // Execute block of code
    ctx.body = await interpret(code, scopes);
  } else {
    ctx.body = false;
  }
});

// Basic math operations

const mathOperations: { [key: string]: (...args: any) => any } = {
  "+": (a: number, b: number) => a + b,
  "-": (a: number, b: number) => a - b,
  "*": (a: number, b: number) => a * b,
  "/": (a: number, b: number) => a / b
};

router.post("/:op/:a/:b", (ctx, next) => {
  const op = mathOperations[ctx.params.op as any];
  if (!op) {
    return next();
  }
  const a = +findVariableValue(ctx.params.a, ctx.request.body.scopes);
  const b = +findVariableValue(ctx.params.b, ctx.request.body.scopes);
  ctx.body = op(a, b);
});

app.use(
  bodyParser({
    enableTypes: ["json"]
  })
);

app.use((ctx, next) => {
  log(`
URL:     ${ctx.req.url}
CODE:    ${JSON.stringify(ctx.request.body.code)}
SCOPE:   ${JSON.stringify(ctx.request.body.scopes)}
MEMORY:  ${JSON.stringify(memory)}
      `);
  return next();
});
app.use(router.routes());
app.use(ctx => (ctx.body = `Route ${ctx.req.url} not found`));

log("listening on port 3000");
app.listen(3000);
