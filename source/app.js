import path from "node:path";
import fastifyAutoload from "@fastify/autoload";
import fastifyStatic from "@fastify/static";
import fastifyCors from "@fastify/cors";

export default async function serviceApp(fastify, opts) {
  delete opts.skipOverride;

  // Register CORS plugin
  fastify.register(fastifyCors, {
    origin: new RegExp(process.env.CORS_ORIGIN_REGEX || ".*"),
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  fastify.register(fastifyAutoload, {
    dir: path.join(import.meta.dirname, "routes"),
    autoHooks: true,
    cascadeHooks: true,
    options: { ...opts },
  });

  fastify.register(fastifyStatic, {
    root: path.join(import.meta.dirname, "static"),
    prefix: "/static",
  });

  fastify.setErrorHandler((err, request, reply) => {
    fastify.log.error(
      {
        err,
        request: {
          method: request.method,
          url: request.url,
          query: request.query,
          params: request.params,
        },
      },
      "Unhandled error occurred",
    );

    reply.code(err.statusCode ?? 500);

    let message = "Internal Server Error";
    if (err.statusCode && err.statusCode < 500) {
      message = err.message;
    }

    return { message };
  });
}
