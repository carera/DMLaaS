import * as Koa from "koa";
import * as Router from "koa-router";
import { log } from "./logger";
import * as uuid from "uuid";
import { interpret } from "./interpreter";
import * as bodyParser from "koa-bodyparser";
const app = new Koa();

const router = new Router();

const memory: { [key: string]: any } = {
  functions: {}
};

// Program initialization

router.post("/program/:name", async ctx => {
  const { name } = ctx.params;
  log(`Initializing program '${name}'`);
  // const id = uuid.v4();
  // memory[id] = {}; // initialize memory for program
  // ctx.body = id;
  const result = await interpret(ctx.request.body);
  ctx.body = result;
});

// Function declaration

router.post("/defn/:name", ctx => {
  const { name } = ctx.params;
  const parameters = ctx.query.params;
  log(
    `Defining function '${name}' with parameters ${JSON.stringify(
      parameters
    )} and body ${JSON.stringify(ctx.request.body, null, 2)}`
  );
  memory.functions[name] = ctx.request.body;
  ctx.body = name;
});

// Function invocation

router.post("/callfn/:name", async ctx => {
  const { name } = ctx.params;
  const args = ctx.query.args;
  log(`Invoking function '${name}' with parameters ${JSON.stringify(args)}`);
  console.log(JSON.stringify(memory, null, 2));
  const result = await interpret(memory.functions[name]);

  ctx.body = result; // return value
});

// Variable declaration

router.post("/var/:name/:value", ctx => {
  memory[ctx.params.name] = ctx.params.value;
  log(`Storing ${ctx.params.name} = ${ctx.params.value}`);
  ctx.body = ctx.params.value;
});

// While loop

// router.post("/while", async ctx => {
//   const condition = ctx.params.cond;
//   log(`looping while ${condition}`);
//   ctx.body = "loop";
// });

// If condition

router.post("/if/:left/:cond/:right", ctx => {});

// Basic math operations

const mathOperations = {
  "+": (a: number, b: number) => a + b,
  "-": (a: number, b: number) => a - b,
  "*": (a: number, b: number) => a * b,
  "/": (a: number, b: number) => a / b
};

router.post("/+/:a/:b", ctx => {
  const a =
    memory[ctx.params.a] !== undefined ? memory[ctx.params.a] : ctx.params.a;
  const b =
    memory[ctx.params.b] !== undefined ? memory[ctx.params.b] : ctx.params.b;
  ctx.body = +a + +b;
});

router.post("/-/:a/:b", ctx => {
  const a =
    memory[ctx.params.a] !== undefined ? memory[ctx.params.a] : ctx.params.a;
  const b =
    memory[ctx.params.b] !== undefined ? memory[ctx.params.b] : ctx.params.b;
  ctx.body = +a - +b;
});
app.use(
  bodyParser({
    enableTypes: ["json"]
  })
);
app.use(router.routes());
app.use(ctx => (ctx.body = `Route ${ctx.req.url} not found`));

log("listening on port 3000");
app.listen(3000);
