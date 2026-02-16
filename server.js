import Fastify from "fastify";
import serviceApp from "./source/app.js";
import dotenv from "dotenv";

export function build_server(opts) {
  const server = Fastify({
    logger: true,
    ...opts,
  });
  server.register(serviceApp, opts);
  return server;
}

if (process.env.NODE_ENV !== "test") {
  dotenv.config();
  const server = build_server();
  server.listen(
    { port: process.env.PORT || 3000, host: "0.0.0.0" },
    function (err) {
      if (err) {
        server.log.error(err);
        process.exit(1);
      }
    },
  );
}
