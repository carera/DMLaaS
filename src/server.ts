import * as Koa from "koa";
import { log } from "./logger";
import * as bodyParser from "koa-bodyparser";
import * as program from "commander";
import router from "./router";
import memory from "./memory";
const app = new Koa();

program
  .option("-p, --port <number>", "Port to listen on", 3000)
  .parse(process.argv);

app.use(
  bodyParser({
    enableTypes: ["json"],
  })
);

app.use((ctx, next) => {
  log(`
=========================================
URL:     ${ctx.req.url}
CODE:    ${JSON.stringify(ctx.request.body.code, null, 2)}
SCOPE:   ${JSON.stringify(ctx.request.body.scopes, null, 2)}
MEMORY:  ${JSON.stringify(memory, null, 2)}
=========================================
      `);
  return next();
});
app.use(router.routes());
app.use((ctx) => (ctx.body = `Route ${ctx.req.url} not found`));

const { port } = program;
log(`listening on port ${port}`);
app.listen(port);
