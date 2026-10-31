// Startup file for WebHostMost (Passenger) when packages are installed on the
// server with "Run NPM Install". Shipped as server.js by
// scripts/package-webhostmost-npm.sh. See docs/DEPLOY_WEBHOSTMOST.md.
const { createServer } = require("node:http");
const next = require("next");

process.env.NODE_ENV = "production";

const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(port, () => {
    console.log(`> Server listening on port ${port}`);
  });
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
